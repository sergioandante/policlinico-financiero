"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

// ---------------------------------------------------------------------------
// Registrar movimiento simple: INGRESO, EGRESO, RETIRO o ADELANTO_SUELDO
// sobre UNA caja. Todo pasa por prisma.$transaction para que el saldo nunca
// quede inconsistente si algo falla a medio camino.
// ---------------------------------------------------------------------------

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
