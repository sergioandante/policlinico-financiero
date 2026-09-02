"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  tipo: z.enum(["CLINICA", "ADMINISTRATIVA"]),
});

export async function crearArea(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarAreas")) {
    return { ok: false, error: "No tienes permiso para crear áreas." };
  }

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.area.create({ data: parsed.data });
  } catch {
    return { ok: false, error: "Ya existe un área con ese nombre." };
  }

  revalidatePath("/areas");
  revalidatePath("/presupuestos");
  revalidatePath("/compras");
  return { ok: true, error: null };
}

export async function actualizarArea(areaId: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarAreas")) {
    return { ok: false, error: "No tienes permiso para editar áreas." };
  }

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.area.update({ where: { id: areaId }, data: parsed.data });
  } catch {
    return { ok: false, error: "Ya existe un área con ese nombre." };
  }

  revalidatePath("/areas");
  revalidatePath("/presupuestos");
  revalidatePath("/compras");
  revalidatePath("/transacciones");
  revalidatePath("/metas");
  return { ok: true, error: null };
}

export async function cambiarEstadoArea(areaId: string, activo: boolean) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarAreas")) {
    return { ok: false, error: "No tienes permiso para editar áreas." };
  }

  await prisma.area.update({ where: { id: areaId }, data: { activo } });
  revalidatePath("/areas");
  return { ok: true, error: null };
}

// Solo permite borrar un área que nunca se usó (sin transacciones,
// presupuestos, metas ni solicitudes de compra asociadas). Si ya tiene
// historial, borrarla dejaría transacciones huérfanas o directamente
// fallaría por las restricciones de la base de datos — para esos casos
// existe "Desactivar", que la oculta sin perder el historial.
export async function eliminarArea(areaId: string) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarAreas")) {
    return { ok: false, error: "No tienes permiso para eliminar áreas." };
  }

  const [transacciones, presupuestos, metas, solicitudes] = await Promise.all([
    prisma.transaccion.count({ where: { areaId } }),
    prisma.presupuesto.count({ where: { areaId } }),
    prisma.metaFinanciera.count({ where: { areaId } }),
    prisma.solicitudCompra.count({ where: { areaId } }),
  ]);

  if (transacciones + presupuestos + metas + solicitudes > 0) {
    return {
      ok: false,
      error: "Esta área ya tiene transacciones, presupuestos, metas o solicitudes registradas. Para no perder ese historial, desactívala en vez de eliminarla.",
    };
  }

  await prisma.area.delete({ where: { id: areaId } });
  revalidatePath("/areas");
  return { ok: true, error: null };
}
