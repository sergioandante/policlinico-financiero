"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquema = z.object({
  nombre: z.string().min(2, "Escribe un nombre para la categoría"),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  esFijo: z.coerce.boolean().optional(),
});

// Permite crear categorías propias del policlínico además de las que vienen
// en el seed inicial, para no quedar limitados a esa lista fija.
export async function crearCategoria(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarCategorias")) {
    return { ok: false, error: "No tienes permiso para crear categorías." };
  }

  const parsed = esquema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    esFijo: formData.get("esFijo") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existente = await prisma.categoria.findFirst({
    where: { nombre: { equals: parsed.data.nombre, mode: "insensitive" }, tipo: parsed.data.tipo },
  });
  if (existente) {
    return { ok: false, error: "Ya existe una categoría con ese nombre." };
  }

  await prisma.categoria.create({
    data: {
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      esFijo: parsed.data.esFijo ?? false,
    },
  });

  revalidatePath("/transacciones");
  return { ok: true, error: null };
}
