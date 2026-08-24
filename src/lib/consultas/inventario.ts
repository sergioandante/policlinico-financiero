import { prisma } from "@/lib/prisma";

export async function obtenerInventario() {
  const items = await prisma.inventarioItem.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  const hoy = new Date();
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 3600 * 1000);

  return items.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    nombre: i.nombre,
    categoria: i.categoria,
    unidadMedida: i.unidadMedida,
    stockActual: i.stockActual,
    stockMinimo: i.stockMinimo,
    stockBajo: i.stockActual <= i.stockMinimo,
    fechaVencimiento: i.fechaVencimiento,
    porVencer: i.fechaVencimiento ? i.fechaVencimiento <= en30dias : false,
  }));
}
