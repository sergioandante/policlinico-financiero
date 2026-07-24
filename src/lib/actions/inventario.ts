"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquemaItem = z.object({
  nombre: z.string().min(2),
  categoria: z.string().min(2),
  unidadMedida: z.string().min(1),
  stockActual: z.coerce.number().int().nonnegative(),
  stockMinimo: z.coerce.number().int().nonnegative(),
  fechaVencimiento: z.string().optional(),
});

export async function crearItemInventario(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarInventario")) {
    return { ok: false, error: "No tienes permiso para editar inventario." };
  }

  const parsed = esquemaItem.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { fechaVencimiento, ...resto } = parsed.data;

  await prisma.inventarioItem.create({
    data: { ...resto, fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null },
  });

  revalidatePath("/inventario");
  return { ok: true, error: null };
}

export async function ajustarStock(itemId: string, tipo: "ENTRADA" | "SALIDA", cantidad: number, motivo: string) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarInventario")) {
    return { ok: false, error: "No tienes permiso para ajustar stock." };
  }
  if (cantidad <= 0) return { ok: false, error: "La cantidad debe ser mayor a 0" };

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.inventarioItem.findUniqueOrThrow({ where: { id: itemId } });
      const nuevoStock = tipo === "ENTRADA" ? item.stockActual + cantidad : item.stockActual - cantidad;
      if (nuevoStock < 0) throw new Error("El stock no puede quedar negativo");

      await tx.inventarioItem.update({ where: { id: itemId }, data: { stockActual: nuevoStock } });
      await tx.movimientoInventario.create({
        data: { itemId, tipo, cantidad, motivo, usuarioId: session.user.id },
      });
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al ajustar stock" };
  }

  revalidatePath("/inventario");
  return { ok: true, error: null };
}
