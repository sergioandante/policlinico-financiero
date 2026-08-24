import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function obtenerAreas() {
  const areas = await prisma.area.findMany({ orderBy: { nombre: "asc" } });
  return areas;
}

export async function obtenerAreasActivas() {
  const areas = await prisma.area.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  return areas;
}

// Ingreso, egreso y margen de cada área en el mes en curso — responde
// "cuánto le está generando" cada área a la administradora.
export async function obtenerResumenPorArea() {
  const ahora = new Date();
  const inicioMes = startOfMonth(ahora);
  const finMes = endOfMonth(ahora);

  const [areas, ingresos, egresos] = await Promise.all([
    prisma.area.findMany({ orderBy: { nombre: "asc" } }),
    prisma.transaccion.groupBy({
      by: ["areaId"],
      where: { tipo: "INGRESO", fecha: { gte: inicioMes, lte: finMes }, areaId: { not: null } },
      _sum: { monto: true },
    }),
    prisma.transaccion.groupBy({
      by: ["areaId"],
      where: { tipo: "EGRESO", fecha: { gte: inicioMes, lte: finMes }, areaId: { not: null } },
      _sum: { monto: true },
    }),
  ]);

  const ingresoPorArea = new Map(ingresos.map((i) => [i.areaId, Number(i._sum.monto ?? 0)]));
  const egresoPorArea = new Map(egresos.map((e) => [e.areaId, Number(e._sum.monto ?? 0)]));

  return areas.map((a) => {
    const ingreso = ingresoPorArea.get(a.id) ?? 0;
    const egreso = egresoPorArea.get(a.id) ?? 0;
    return {
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo,
      activo: a.activo,
      ingreso,
      egreso,
      margen: ingreso - egreso,
    };
  });
}
