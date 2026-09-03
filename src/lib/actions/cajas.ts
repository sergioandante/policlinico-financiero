"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { Prisma } from "@prisma/client";

const TIPOS_SALIDA = new Set(["EGRESO", "RETIRO", "ADELANTO_SUELDO", "TRASPASO_SALIDA"]);

// Recalcula saldoAnterior/saldoNuevo de TODOS los movimientos de una caja en
// orden cronológico, y el saldoActual final de la caja. Se corre después de
// cualquier edición o borrado de un movimiento histórico, porque cambiar un
// monto a mitad de la lista desactualiza el saldo "arrastrado" de todo lo que
// vino después — así el historial nunca queda descuadrado.
// Todas las actualizaciones fila por fila de esta función van en UN solo
// UPDATE por lote (en vez de un roundtrip a la base de datos por movimiento):
// una caja con un historial largo puede tener decenas de movimientos, y
// actualizarlos uno por uno dentro de la misma transacción interactiva de
// Prisma puede superar su límite de tiempo por defecto (5s) y hacer que la
// transacción expire a la mitad ("Transaction not found").
async function actualizarEnLote(
  tx: Prisma.TransactionClient,
  cambios: { id: string; saldoAnterior?: number; saldoNuevo?: number; fecha?: Date }[]
) {
  if (cambios.length === 0) return;

  await tx.$executeRaw(
    Prisma.sql`
      UPDATE movimientos_caja AS m
      SET
        "saldoAnterior" = COALESCE(v.saldo_anterior, m."saldoAnterior"),
        "saldoNuevo" = COALESCE(v.saldo_nuevo, m."saldoNuevo"),
        fecha = COALESCE(v.fecha, m.fecha)
      FROM (VALUES ${Prisma.join(
        cambios.map(
          (c) =>
            Prisma.sql`(${c.id}::text, ${c.saldoAnterior ?? null}::numeric, ${c.saldoNuevo ?? null}::numeric, ${c.fecha ?? null}::timestamp)`
        )
      )}) AS v(id, saldo_anterior, saldo_nuevo, fecha)
      WHERE m.id = v.id;
    `
  );
}

// Recalcula saldoAnterior/saldoNuevo de TODOS los movimientos de una caja en
// orden cronológico, y el saldoActual final de la caja. Se corre después de
// cualquier edición o borrado de un movimiento histórico, porque cambiar un
// monto a mitad de la lista desactualiza el saldo "arrastrado" de todo lo que
// vino después — así el historial nunca queda descuadrado.
export async function recalcularSaldosCaja(tx: Prisma.TransactionClient, cajaId: string) {
  const movimientos = await tx.movimientoCaja.findMany({
    where: { cajaId },
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
  });

  let saldo = 0;
  const cambios: { id: string; saldoAnterior: number; saldoNuevo: number }[] = [];
  for (const m of movimientos) {
    const monto = Number(m.monto);
    const saldoAnterior = saldo;
    saldo = TIPOS_SALIDA.has(m.tipo) ? saldo - monto : saldo + monto;

    if (saldo < -0.01) {
      throw new Error(
        `Ese cambio dejaría el saldo en negativo (S/ ${saldo.toFixed(2)}) el ${format(m.fecha, "dd/MM/yyyy", { locale: es })}. Revisa el monto o la fecha.`
      );
    }

    if (Number(m.saldoAnterior) !== saldoAnterior || Number(m.saldoNuevo) !== saldo) {
      cambios.push({ id: m.id, saldoAnterior, saldoNuevo: saldo });
    }
  }

  await actualizarEnLote(tx, cambios);
  await tx.caja.update({ where: { id: cajaId }, data: { saldoActual: saldo } });
}

// Los movimientos generados por una transacción no copiaban la fecha elegida
// en el formulario (quedaban con la fecha de creación, "ahora"), lo que podía
// desordenar la recalculación cronológica si la transacción se registró con
// fecha atrasada. Sincroniza esos movimientos con la fecha real de su
// transacción antes de recalcular, para que el orden coincida con lo que se
// ve en Transacciones.
export async function sincronizarFechasMovimientosCaja(tx: Prisma.TransactionClient, cajaId: string) {
  const movimientos = await tx.movimientoCaja.findMany({
    where: { cajaId, transaccionId: { not: null } },
    include: { transaccion: true },
  });

  const cambios = movimientos
    .filter((m) => m.transaccion && m.transaccion.fecha.getTime() !== m.fecha.getTime())
    .map((m) => ({ id: m.id, fecha: m.transaccion!.fecha }));

  await actualizarEnLote(tx, cambios);
}

// ---------------------------------------------------------------------------
// Registrar movimiento simple: INGRESO, EGRESO, RETIRO o ADELANTO_SUELDO
// sobre UNA caja. Todo pasa por prisma.$transaction para que el saldo nunca
// quede inconsistente si algo falla a medio camino.
// ---------------------------------------------------------------------------

const esquemaCaja = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
});

// Solo renombra la caja (el "tipo" CHICA/GRANDE es fijo, es lo que usa el
// resto del sistema para saber cuál es cuál). El saldo nunca se edita aquí
// directamente: siempre pasa por un movimiento, para que quede auditado.
export async function actualizarCaja(cajaId: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarMovimientoCaja")) {
    return { ok: false, error: "No tienes permiso para editar cajas." };
  }

  const parsed = esquemaCaja.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.caja.update({ where: { id: cajaId }, data: { nombre: parsed.data.nombre } });
  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

const esquemaMovimiento = z.object({
  cajaId: z.string().min(1),
  tipo: z.enum(["INGRESO", "EGRESO", "RETIRO", "ADELANTO_SUELDO"]),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  descripcion: z.string().min(3, "Describe brevemente el movimiento"),
  beneficiario: z.string().optional(),
});

export async function registrarMovimientoCaja(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarMovimientoCaja")) {
    return { ok: false, error: "No tienes permiso para registrar movimientos de caja." };
  }

  const parsed = esquemaMovimiento.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { cajaId, tipo, monto, descripcion, beneficiario } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const caja = await tx.caja.findUniqueOrThrow({ where: { id: cajaId } });
      const saldoAnterior = Number(caja.saldoActual);
      const esSalida = tipo === "EGRESO" || tipo === "RETIRO" || tipo === "ADELANTO_SUELDO";
      const saldoNuevo = esSalida ? saldoAnterior - monto : saldoAnterior + monto;

      if (esSalida && saldoNuevo < 0) {
        throw new Error(`Saldo insuficiente en ${caja.nombre}. Disponible: S/ ${saldoAnterior.toFixed(2)}`);
      }

      await tx.caja.update({ where: { id: cajaId }, data: { saldoActual: saldoNuevo } });

      await tx.movimientoCaja.create({
        data: {
          cajaId,
          tipo,
          monto,
          saldoAnterior,
          saldoNuevo,
          descripcion,
          beneficiario: beneficiario || null,
          usuarioId: session.user.id,
        },
      });
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al registrar el movimiento" };
  }

  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

// ---------------------------------------------------------------------------
// Traspaso entre cajas: genera DOS movimientos ligados (salida + entrada)
// dentro de una misma transacción atómica, con un traspasoRef compartido
// para poder rastrear el par en el historial.
// ---------------------------------------------------------------------------

const esquemaTraspaso = z
  .object({
    cajaOrigenId: z.string().min(1),
    cajaDestinoId: z.string().min(1),
    monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
    descripcion: z.string().min(3, "Describe el motivo del traspaso"),
  })
  .refine((d) => d.cajaOrigenId !== d.cajaDestinoId, {
    message: "La caja de origen y destino no pueden ser la misma",
  });

export async function registrarTraspaso(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarMovimientoCaja")) {
    return { ok: false, error: "No tienes permiso para registrar traspasos." };
  }

  const parsed = esquemaTraspaso.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { cajaOrigenId, cajaDestinoId, monto, descripcion } = parsed.data;
  const traspasoRef = `TRSP-${Date.now()}`;

  try {
    await prisma.$transaction(async (tx) => {
      const origen = await tx.caja.findUniqueOrThrow({ where: { id: cajaOrigenId } });
      const destino = await tx.caja.findUniqueOrThrow({ where: { id: cajaDestinoId } });

      const saldoAnteriorOrigen = Number(origen.saldoActual);
      const saldoAnteriorDestino = Number(destino.saldoActual);

      if (saldoAnteriorOrigen - monto < 0) {
        throw new Error(`Saldo insuficiente en ${origen.nombre}. Disponible: S/ ${saldoAnteriorOrigen.toFixed(2)}`);
      }

      const saldoNuevoOrigen = saldoAnteriorOrigen - monto;
      const saldoNuevoDestino = saldoAnteriorDestino + monto;

      await tx.caja.update({ where: { id: cajaOrigenId }, data: { saldoActual: saldoNuevoOrigen } });
      await tx.caja.update({ where: { id: cajaDestinoId }, data: { saldoActual: saldoNuevoDestino } });

      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaOrigenId,
          cajaDestinoId,
          tipo: "TRASPASO_SALIDA",
          monto,
          saldoAnterior: saldoAnteriorOrigen,
          saldoNuevo: saldoNuevoOrigen,
          descripcion: `Traspaso a ${destino.nombre}: ${descripcion}`,
          traspasoRef,
          usuarioId: session.user.id,
        },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaDestinoId,
          cajaDestinoId: cajaOrigenId,
          tipo: "TRASPASO_ENTRADA",
          monto,
          saldoAnterior: saldoAnteriorDestino,
          saldoNuevo: saldoNuevoDestino,
          descripcion: `Traspaso desde ${origen.nombre}: ${descripcion}`,
          traspasoRef,
          usuarioId: session.user.id,
        },
      });
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al registrar el traspaso" };
  }

  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

// ---------------------------------------------------------------------------
// Editar / eliminar un movimiento ya registrado. Dos casos quedan fuera a
// propósito:
// - Movimientos que vienen de una Transacción (transaccionId): se editan
//   desde Transacciones, que ya sabe revertir y reaplicar el efecto en caja
//   correctamente. Tocarlos aquí dejaría la transacción original desfasada.
// - Los traspasos no se editan (solo se eliminan, de a par): cambiar el
//   monto de un solo lado dejaría a la otra caja con un traspaso a medias.
// ---------------------------------------------------------------------------

const esquemaEdicionMovimiento = z.object({
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  descripcion: z.string().min(3, "Describe brevemente el movimiento"),
  beneficiario: z.string().optional(),
  fecha: z.string().min(1),
});

export async function actualizarMovimientoCaja(movimientoId: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarMovimientoCaja")) {
    return { ok: false, error: "No tienes permiso para editar movimientos de caja." };
  }

  const parsed = esquemaEdicionMovimiento.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const movimiento = await tx.movimientoCaja.findUniqueOrThrow({ where: { id: movimientoId } });
        if (movimiento.transaccionId) {
          throw new Error("Este movimiento viene de una transacción — edítalo desde Transacciones.");
        }
        if (movimiento.tipo === "TRASPASO_SALIDA" || movimiento.tipo === "TRASPASO_ENTRADA") {
          throw new Error("Los traspasos no se pueden editar. Elimínalo y regístralo de nuevo si el monto es incorrecto.");
        }

        await tx.movimientoCaja.update({
          where: { id: movimientoId },
          data: {
            monto: parsed.data.monto,
            descripcion: parsed.data.descripcion,
            beneficiario: parsed.data.beneficiario || null,
            fecha: new Date(parsed.data.fecha),
          },
        });

        await sincronizarFechasMovimientosCaja(tx, movimiento.cajaId);
        await recalcularSaldosCaja(tx, movimiento.cajaId);
      },
      { timeout: 20000 }
    );
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al actualizar el movimiento" };
  }

  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function eliminarMovimientoCaja(movimientoId: string) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarMovimientoCaja")) {
    return { ok: false, error: "No tienes permiso para eliminar movimientos de caja." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const movimiento = await tx.movimientoCaja.findUniqueOrThrow({ where: { id: movimientoId } });
        if (movimiento.transaccionId) {
          throw new Error("Este movimiento viene de una transacción — elimínalo desde Transacciones.");
        }

        const cajasAfectadas = new Set([movimiento.cajaId]);

        if (movimiento.traspasoRef) {
          const par = await tx.movimientoCaja.findFirst({
            where: { traspasoRef: movimiento.traspasoRef, id: { not: movimiento.id } },
          });
          if (par) {
            cajasAfectadas.add(par.cajaId);
            await tx.movimientoCaja.delete({ where: { id: par.id } });
          }
        }

        await tx.movimientoCaja.delete({ where: { id: movimiento.id } });

        for (const cajaId of cajasAfectadas) {
          await sincronizarFechasMovimientosCaja(tx, cajaId);
          await recalcularSaldosCaja(tx, cajaId);
        }
      },
      { timeout: 20000 }
    );
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al eliminar el movimiento" };
  }

  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}
