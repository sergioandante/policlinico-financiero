"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquema = z.object({
  areaId: z.string().min(1),
  nombre: z.string().min(3),
  montoAsignado: z.coerce.number().positive(),
  periodoMes: z.coerce.number().int().min(1).max(12),
  periodoAnio: z.coerce.number().int().min(2020),
  umbralAlerta: z.coerce.number().int().min(1).max(100).default(80),
});

export async function crearPresupuesto(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarPresupuestos")) {
    return { ok: false, error: "No tienes permiso para crear presupuestos." };
  }

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.presupuesto.create({ data: parsed.data });
  } catch (e: any) {
    return { ok: false, error: "Ya existe un presupuesto para esa área en ese periodo." };
  }

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function actualizarPresupuesto(id: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarPresupuestos")) {
    return { ok: false, error: "No tienes permiso para editar presupuestos." };
  }

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.presupuesto.update({ where: { id }, data: parsed.data });
  } catch (e: any) {
    return { ok: false, error: "Ya existe un presupuesto para esa área en ese periodo." };
  }

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}
