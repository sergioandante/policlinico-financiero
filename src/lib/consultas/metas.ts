import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

// Progreso de cada meta económica contra lo real del mes.
// INGRESO_MENSUAL y AHORRO: "más es mejor" (progreso = real / objetivo).
// REDUCCION_GASTO: "menos es mejor" — el objetivo es un tope de gasto, se
// cumple si el gasto real se queda por debajo.
export async function obtenerMetasConProgreso() {
  const ahora = new Date();
  const metas = await prisma.metaFinanciera.findMany({
    where: { periodoMes: ahora.getMonth() + 1, periodoAnio: ahora.getFullYear() },
    include: { area: true },
    orderBy: { createdAt: "asc" },
  });

  const inicioMes = startOfMonth(ahora);
  const finMes = endOfMonth(ahora);

  const resultado = [];
  for (const m of metas) {
    const whereBase = { areaId: m.areaId ?? undefined, fecha: { gte: inicioMes, lte: finMes } };
    const montoObjetivo = Number(m.montoObjetivo);
    let montoReal = 0;

    if (m.tipo === "INGRESO_MENSUAL") {
      const agg = await prisma.transaccion.aggregate({ _sum: { monto: true }, where: { ...whereBase, tipo: "INGRESO" } });
      montoReal = Number(agg._sum.monto ?? 0);
    } else if (m.tipo === "AHORRO") {
      const [ing, egr] = await Promise.all([
        prisma.transaccion.aggregate({ _sum: { monto: true }, where: { ...whereBase, tipo: "INGRESO" } }),
        prisma.transaccion.aggregate({ _sum: { monto: true }, where: { ...whereBase, tipo: "EGRESO" } }),
      ]);
      montoReal = Number(ing._sum.monto ?? 0) - Number(egr._sum.monto ?? 0);
    } else if (m.tipo === "REDUCCION_GASTO") {
      const agg = await prisma.transaccion.aggregate({ _sum: { monto: true }, where: { ...whereBase, tipo: "EGRESO" } });
      montoReal = Number(agg._sum.monto ?? 0);
    }

    const esReduccion = m.tipo === "REDUCCION_GASTO";
    const cumple = esReduccion ? montoReal <= montoObjetivo : montoReal >= montoObjetivo;
    const porcentaje = esReduccion
      ? montoObjetivo > 0
        ? Math.min(100, (montoObjetivo / Math.max(montoReal, 0.01)) * 100)
        : 100
      : montoObjetivo > 0
        ? (montoReal / montoObjetivo) * 100
        : 0;

    resultado.push({
      id: m.id,
      nombre: m.nombre,
      tipo: m.tipo,
      area: m.area?.nombre ?? "Todo el policlínico",
      montoObjetivo,
      montoReal,
      porcentaje,
      cumple,
      notas: m.notas,
    });
  }

  return resultado;
}
