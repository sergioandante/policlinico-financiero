"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquemaMetrica = z.object({
  fecha: z.string().min(1),
  pesoKg: z.coerce.number().positive("El peso debe ser mayor a 0"),
  alturaCm: z.coerce.number().positive("La altura debe ser mayor a 0"),
  presionSistolica: z.coerce.number().int().min(50).max(300),
  presionDiastolica: z.coerce.number().int().min(30).max(200),
  notas: z.string().optional(),
});

// Registra una métrica de salud diaria del doctor autenticado. Siempre usa
// session.user.id como usuarioId — un doctor NUNCA puede registrar ni ver
// biodata de otro usuario (no se acepta un usuarioId por formulario).
export async function registrarMetricaSalud(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "registrarBiodata")) {
    return { ok: false, error: "No tienes permiso para registrar biodata." };
  }

  const parsed = esquemaMetrica.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { fecha, pesoKg, alturaCm, presionSistolica, presionDiastolica, notas } = parsed.data;

  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);

  try {
    await prisma.metricaSalud.create({
      data: {
        usuarioId: session.user.id,
        fecha: new Date(fecha),
        pesoKg,
        alturaCm,
        imc,
        presionSistolica,
        presionDiastolica,
        notas: notas || null,
      },
    });
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Error al registrar la métrica" };
  }

  revalidatePath("/biodata");
  return { ok: true, error: null };
}
