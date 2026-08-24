"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquema = z.object({
  nombre: z.string().min(3),
  tipo: z.enum(["INGRESO_MENSUAL", "AHORRO", "REDUCCION_GASTO"]),
  montoObjetivo: z.coerce.number().positive(),
  areaId: z.string().optional(),
  periodoMes: z.coerce.number().int().min(1).max(12),
  periodoAnio: z.coerce.number().int().min(2020),
  notas: z.string().optional(),
});

export async function crearMeta(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarMetas")) {
    return { ok: false, error: "No tienes permiso para crear metas." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = esquema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { areaId, ...resto } = parsed.data;
  await prisma.metaFinanciera.create({
    data: { ...resto, areaId: areaId || null, notas: parsed.data.notas || null },
  });

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function actualizarMeta(id: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "editarMetas")) {
    return { ok: false, error: "No tienes permiso para editar metas." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = esquema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { areaId, ...resto } = parsed.data;
  await prisma.metaFinanciera.update({
    where: { id },
    data: { ...resto, areaId: areaId || null, notas: parsed.data.notas || null },
  });

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}
