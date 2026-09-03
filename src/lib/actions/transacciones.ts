"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { recalcularSaldosCaja, sincronizarFechasMovimientosCaja } from "@/lib/actions/cajas";

const esquemaTransaccion = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1),
  categoriaId: z.string().min(1, "Selecciona una categoría"),
  areaId: z.string().min(1, "Selecciona el área"),
  descripcion: z.string().min(3, "Agrega una descripción"),
  metodoPago: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE_PLIN", "OTRO"]),
  comprobante: z.string().optional(),
  proveedorOCliente: z.string().optional(),
  cajaId: z.string().optional(),
});

// Crea la transacción y, si está ligada a una caja, genera el movimiento de
// caja correspondiente en la MISMA transacción de base de datos.
export async function crearTransaccion(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "crearTransacciones")) {
    return { ok: false, error: "No tienes permiso para registrar transacciones." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = esquemaTransaccion.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const transaccion = await tx.transaccion.create({
        data: {
          tipo: data.tipo,
          monto: data.monto,
          fecha: new Date(data.fecha),
          categoriaId: data.categoriaId,
          areaId: data.areaId,
          descripcion: data.descripcion,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || null,
          proveedorOCliente: data.proveedorOCliente || null,
          cajaId: data.cajaId || null,
          usuarioId: session.user.id,
        },
      });

      if (data.cajaId) {
        const caja = await tx.caja.findUniqueOrThrow({ where: { id: data.cajaId } });
        const saldoAnterior = Number(caja.saldoActual);
        const saldoNuevo = data.tipo === "INGRESO" ? saldoAnterior + data.monto : saldoAnterior - data.monto;

        if (data.tipo === "EGRESO" && saldoNuevo < 0) {
          throw new Error(`Saldo insuficiente en ${caja.nombre}. Disponible: S/ ${saldoAnterior.toFixed(2)}`);
        }

        await tx.caja.update({ where: { id: data.cajaId }, data: { saldoActual: saldoNuevo } });
        await tx.movimientoCaja.create({
          data: {
            cajaId: data.cajaId,
            tipo: data.tipo,
            monto: data.monto,
            saldoAnterior,
            saldoNuevo,
            descripcion: data.descripcion,
            fecha: new Date(data.fecha),
            transaccionId: transaccion.id,
            usuarioId: session.user.id,
          },
        });
      }
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al registrar la transacción" };
  }

  revalidatePath("/transacciones");
  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  revalidatePath("/presupuestos");
  return { ok: true, error: null };
}

// Edita una transacción existente. Si estaba (o queda) ligada a una caja,
// primero revierte el efecto del movimiento original sobre el saldo y luego
// aplica el nuevo, todo dentro de la misma transacción de base de datos para
// que el saldo de caja nunca quede inconsistente a medio camino.
export async function actualizarTransaccion(id: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarTransacciones")) {
    return { ok: false, error: "No tienes permiso para editar transacciones." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = esquemaTransaccion.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const original = await tx.transaccion.findUniqueOrThrow({ where: { id } });
      const movimientoOriginal = await tx.movimientoCaja.findFirst({ where: { transaccionId: id } });

      if (movimientoOriginal) {
        const caja = await tx.caja.findUniqueOrThrow({ where: { id: movimientoOriginal.cajaId } });
        const saldoRevertido =
          original.tipo === "INGRESO"
            ? Number(caja.saldoActual) - Number(original.monto)
            : Number(caja.saldoActual) + Number(original.monto);
        await tx.caja.update({ where: { id: caja.id }, data: { saldoActual: saldoRevertido } });
        await tx.movimientoCaja.delete({ where: { id: movimientoOriginal.id } });
      }

      await tx.transaccion.update({
        where: { id },
        data: {
          tipo: data.tipo,
          monto: data.monto,
          fecha: new Date(data.fecha),
          categoriaId: data.categoriaId,
          areaId: data.areaId,
          descripcion: data.descripcion,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || null,
          proveedorOCliente: data.proveedorOCliente || null,
          cajaId: data.cajaId || null,
        },
      });

      if (data.cajaId) {
        const caja = await tx.caja.findUniqueOrThrow({ where: { id: data.cajaId } });
        const saldoAnterior = Number(caja.saldoActual);
        const saldoNuevo = data.tipo === "INGRESO" ? saldoAnterior + data.monto : saldoAnterior - data.monto;

        if (data.tipo === "EGRESO" && saldoNuevo < 0) {
          throw new Error(`Saldo insuficiente en ${caja.nombre}. Disponible: S/ ${saldoAnterior.toFixed(2)}`);
        }

        await tx.caja.update({ where: { id: data.cajaId }, data: { saldoActual: saldoNuevo } });
        await tx.movimientoCaja.create({
          data: {
            cajaId: data.cajaId,
            tipo: data.tipo,
            monto: data.monto,
            saldoAnterior,
            saldoNuevo,
            descripcion: data.descripcion,
            fecha: new Date(data.fecha),
            transaccionId: id,
            usuarioId: session.user.id,
          },
        });
      }
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al actualizar la transacción" };
  }

  revalidatePath("/transacciones");
  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  revalidatePath("/presupuestos");
  return { ok: true, error: null };
}

// Elimina una transacción. Si estaba ligada a una caja, borra su movimiento
// asociado y recalcula el saldo cronológico completo de esa caja (en vez de
// solo revertir el monto), para que borrar una transacción antigua no deje
// descuadrado el historial de movimientos posteriores.
export async function eliminarTransaccion(id: string) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarTransacciones")) {
    return { ok: false, error: "No tienes permiso para eliminar transacciones." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const movimiento = await tx.movimientoCaja.findFirst({ where: { transaccionId: id } });

        await tx.transaccion.delete({ where: { id } });

        if (movimiento) {
          await tx.movimientoCaja.delete({ where: { id: movimiento.id } });
          await sincronizarFechasMovimientosCaja(tx, movimiento.cajaId);
          await recalcularSaldosCaja(tx, movimiento.cajaId);
        }
      },
      { timeout: 20000 }
    );
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al eliminar la transacción" };
  }

  revalidatePath("/transacciones");
  revalidatePath("/cajas");
  revalidatePath("/dashboard");
  revalidatePath("/presupuestos");
  return { ok: true, error: null };
}

// Usado por la importación de Excel: inserta muchas transacciones de golpe.
// No afecta caja (las ventas históricas importadas no deben re-mover saldos
// ya conciliados); si el cliente lo requiere, se puede activar por fila.
export async function crearTransaccionesEnLote(
  filas: {
    tipo: "INGRESO" | "EGRESO";
    monto: number;
    fecha: Date;
    categoriaId: string;
    areaId?: string | null;
    descripcion: string;
    metodoPago: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "YAPE_PLIN" | "OTRO";
  }[],
  usuarioId: string
) {
  await prisma.transaccion.createMany({
    data: filas.map((f) => ({ ...f, origen: "IMPORTACION_EXCEL" as const, usuarioId })),
  });
  revalidatePath("/transacciones");
  revalidatePath("/dashboard");
}
