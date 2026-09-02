import { prisma } from "@/lib/prisma";

// A diferencia de obtenerCategorias() (usada en los formularios de
// transacciones, que solo debe ofrecer categorías activas), esta trae TODAS
// para la página de gestión — activas e inactivas.
export async function obtenerTodasLasCategorias() {
  const categorias = await prisma.categoria.findMany({
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
    include: { _count: { select: { transacciones: true } } },
  });

  return categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    esFijo: c.esFijo,
    activo: c.activo,
    enUso: c._count.transacciones > 0,
  }));
}
