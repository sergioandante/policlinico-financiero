import { prisma } from "@/lib/prisma";

export async function obtenerCategorias(tipo?: "INGRESO" | "EGRESO") {
  const categorias = await prisma.categoria.findMany({
    where: { activo: true, ...(tipo ? { tipo } : {}) },
    orderBy: [{ parentId: "asc" }, { nombre: "asc" }],
  });
  return categorias;
}

export async function obtenerTransacciones(filtros: {
  tipo?: string;
  categoriaId?: string;
  desde?: string;
  hasta?: string;
}) {
  const where: any = {};
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fecha.lte = new Date(filtros.hasta + "T23:59:59");
  }

  const transacciones = await prisma.transaccion.findMany({
    where,
    include: { categoria: true, usuario: true },
    orderBy: { fecha: "desc" },
    take: 300,
  });

  return transacciones.map((t) => ({
    id: t.id,
    tipo: t.tipo,
    monto: Number(t.monto),
    fecha: t.fecha,
    categoria: t.categoria.nombre,
    descripcion: t.descripcion,
    metodoPago: t.metodoPago,
    origen: t.origen,
    usuario: t.usuario.nombre,
  }));
}
