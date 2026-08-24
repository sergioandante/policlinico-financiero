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
  areaId?: string;
  desde?: string;
  hasta?: string;
}) {
  const where: any = {};
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
  if (filtros.areaId) where.areaId = filtros.areaId;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fecha.lte = new Date(filtros.hasta + "T23:59:59");
  }

  const transacciones = await prisma.transaccion.findMany({
    where,
    include: { categoria: true, usuario: true, area: true },
    orderBy: { fecha: "desc" },
    take: 300,
  });

  return transacciones.map((t) => ({
    id: t.id,
    tipo: t.tipo,
    monto: Number(t.monto),
    fecha: t.fecha,
    categoriaId: t.categoriaId,
    categoria: t.categoria.nombre,
    esFijo: t.categoria.esFijo,
    areaId: t.areaId,
    area: t.area?.nombre ?? null,
    descripcion: t.descripcion,
    metodoPago: t.metodoPago,
    comprobante: t.comprobante,
    proveedorOCliente: t.proveedorOCliente,
    cajaId: t.cajaId,
    origen: t.origen,
    usuario: t.usuario.nombre,
  }));
}
