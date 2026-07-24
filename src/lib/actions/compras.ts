"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { generarCodigoSolicitud } from "@/lib/utils";

const esquemaItem = z.object({
  descripcion: z.string().min(1),
  cantidad: z.coerce.number().int().positive(),
  precioEstimado: z.coerce.number().nonnegative(),
});

const esquemaSolicitud = z.object({
  area: z.string().min(1, "Selecciona un área"),
  justificacion: z.string().min(5, "Explica brevemente el motivo de la compra"),
  items: z.array(esquemaItem).min(1, "Agrega al menos un ítem"),
});

export async function crearSolicitudCompra(input: {
  area: string;
  justificacion: string;
  items: { descripcion: string; cantidad: number; precioEstimado: number }[];
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "crearSolicitudCompra")) {
    return { ok: false, error: "No tienes permiso para crear solicitudes de compra." };
  }

  const parsed = esquemaSolicitud.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { area, justificacion, items } = parsed.data;
  const montoEstimado = items.reduce((sum, i) => sum + i.cantidad * i.precioEstimado, 0);

  const total = await prisma.solicitudCompra.count();

  await prisma.solicitudCompra.create({
    data: {
      codigo: generarCodigoSolicitud(total + 1),
      area,
      justificacion,
      montoEstimado,
      solicitanteId: session.user.id,
      items: { create: items },
    },
  });

  revalidatePath("/compras");
  return { ok: true, error: null };
}

export async function resolverSolicitudCompra(
  solicitudId: string,
  estado: "APROBADA" | "RECHAZADA",
  comentario: string
) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "aprobarSolicitudCompra")) {
    return { ok: false, error: "No tienes permiso para aprobar o rechazar solicitudes." };
  }

  await prisma.solicitudCompra.update({
    where: { id: solicitudId },
    data: {
      estado,
      aprobadorId: session.user.id,
      comentarioResolucion: comentario || null,
      fechaResolucion: new Date(),
    },
  });

  revalidatePath("/compras");
  return { ok: true, error: null };
}
