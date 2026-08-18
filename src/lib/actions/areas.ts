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

export async function cambiarEstadoArea(areaId: string, activo: boolean) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarAreas")) {
    return { ok: false, error: "No tienes permiso para editar áreas." };
  }

  await prisma.area.update({ where: { id: areaId }, data: { activo } });
  revalidatePath("/areas");
  return { ok: true, error: null };
}
