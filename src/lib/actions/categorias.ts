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
  revalidatePath("/categorias");
  return { ok: true, error: null };
}

const esquemaEdicion = z.object({
  nombre: z.string().min(2, "Escribe un nombre para la categoría"),
  esFijo: z.coerce.boolean().optional(),
});

// El tipo (INGRESO/EGRESO) no se puede editar: cambiarlo en una categoría ya
// usada dejaría transacciones de un tipo clasificadas bajo el tipo contrario
// en todos los reportes. Para eso, mejor crear una categoría nueva.
export async function actualizarCategoria(categoriaId: string, _prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarCategorias")) {
    return { ok: false, error: "No tienes permiso para editar categorías." };
  }

  const parsed = esquemaEdicion.safeParse({
    nombre: formData.get("nombre"),
    esFijo: formData.get("esFijo") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.categoria.update({
    where: { id: categoriaId },
    data: { nombre: parsed.data.nombre, esFijo: parsed.data.esFijo ?? false },
  });

  revalidatePath("/categorias");
  revalidatePath("/transacciones");
  return { ok: true, error: null };
}

export async function cambiarEstadoCategoria(categoriaId: string, activo: boolean) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarCategorias")) {
    return { ok: false, error: "No tienes permiso para editar categorías." };
  }

  await prisma.categoria.update({ where: { id: categoriaId }, data: { activo } });
  revalidatePath("/categorias");
  revalidatePath("/transacciones");
  return { ok: true, error: null };
}

// Solo permite borrar una categoría que nunca se usó: categoriaId es
// obligatorio en Transaccion, así que borrar una categoría con historial
// dejaría esas transacciones sin categoría válida. Para esos casos existe
// "Desactivar", que la saca de la lista sin tocar el historial.
export async function eliminarCategoria(categoriaId: string) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarCategorias")) {
    return { ok: false, error: "No tienes permiso para eliminar categorías." };
  }

  const [enUso, subcategorias] = await Promise.all([
    prisma.transaccion.count({ where: { categoriaId } }),
    prisma.categoria.count({ where: { parentId: categoriaId } }),
  ]);
  if (enUso > 0) {
    return {
      ok: false,
      error: "Esta categoría ya tiene transacciones registradas. Para no perder ese historial, desactívala en vez de eliminarla.",
    };
  }
  if (subcategorias > 0) {
    return { ok: false, error: "Esta categoría tiene subcategorías. Elimina o reasigna esas primero." };
  }

  await prisma.categoria.delete({ where: { id: categoriaId } });
  revalidatePath("/categorias");
  revalidatePath("/transacciones");
  return { ok: true, error: null };
}
