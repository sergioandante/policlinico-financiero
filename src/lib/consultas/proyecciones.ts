import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

// Proyección de ingresos y egresos futuros — heurística simple a propósito
// (promedio móvil + tendencia lineal básica), igual de espíritu que la
// detección de anomalías del dashboard: da una primera estimación útil sin
// pretender ser un modelo econométrico. Se puede perfeccionar más adelante.

const MESES_HISTORIAL = 6;

async function serieMensual(tipo: "INGRESO" | "EGRESO", esFijo?: boolean) {
  const ahora = new Date();
  const serie: { mes: string; monto: number }[] = [];
  for (let i = MESES_HISTORIAL - 1; i >= 0; i--) {
    const mes = subMonths(ahora, i);
    const inicio = startOfMonth(mes);
    const fin = endOfMonth(mes);
    const where: any = { tipo, fecha: { gte: inicio, lte: fin } };
    if (esFijo !== undefined) where.categoria = { esFijo };
    const agg = await prisma.transaccion.aggregate({ _sum: { monto: true }, where });
    serie.push({ mes: format(mes, "MMM yyyy", { locale: es }), monto: Number(agg._sum.monto ?? 0) });
  }
  return serie;
}

// Promedio de los últimos 3 meses + tendencia (pendiente simple entre el
// primer y último mes de la serie) para proyectar el próximo mes.
function proyectar(serie: { mes: string; monto: number }[]) {
  const ultimos3 = serie.slice(-3);
  const promedio = ultimos3.reduce((a, s) => a + s.monto, 0) / ultimos3.length;
  const tendencia = (serie[serie.length - 1].monto - serie[0].monto) / (serie.length - 1);
  const proyeccion = Math.max(0, promedio + tendencia);
  const montos = serie.map((s) => s.monto);
  return {
    proyeccion,
    minimo: Math.min(...montos),
    maximo: Math.max(...montos),
    tendencia,
  };
}

export async function obtenerProyeccionConsolidada() {
  const [serieIngresos, serieEgresosFijos, serieEgresosVariables] = await Promise.all([
    serieMensual("INGRESO"),
    serieMensual("EGRESO", true),
    serieMensual("EGRESO", false),
  ]);

  const ingresos = proyectar(serieIngresos);
  const egresosFijos = proyectar(serieEgresosFijos);
  const egresosVariables = proyectar(serieEgresosVariables);

  const proximoMes = format(addMonths(new Date(), 1), "MMMM yyyy", { locale: es });

  const serieCombinada = serieIngresos.map((s, i) => ({
    mes: s.mes,
    ingresos: s.monto,
    egresosFijos: serieEgresosFijos[i].monto,
    egresosVariables: serieEgresosVariables[i].monto,
    egresosTotal: serieEgresosFijos[i].monto + serieEgresosVariables[i].monto,
  }));

  const utilidadProyectada = ingresos.proyeccion - (egresosFijos.proyeccion + egresosVariables.proyeccion);

  return {
    proximoMes,
    serieCombinada,
    ingresos,
    egresosFijos,
    egresosVariables,
    egresosTotalProyeccion: egresosFijos.proyeccion + egresosVariables.proyeccion,
    utilidadProyectada,
  };
}

// Proyección por área: promedio de los últimos 3 meses de ingreso/egreso,
// extrapolado al próximo mes — ayuda a decidir presupuestos por adelantado.
export async function obtenerProyeccionPorArea() {
  const ahora = new Date();
  const areas = await prisma.area.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });

  const resultado = [];
  for (const area of areas) {
    let ingresoTotal = 0;
    let egresoTotal = 0;
    for (let i = 2; i >= 0; i--) {
      const mes = subMonths(ahora, i);
      const inicio = startOfMonth(mes);
      const fin = endOfMonth(mes);
      const [ing, egr] = await Promise.all([
        prisma.transaccion.aggregate({
          _sum: { monto: true },
          where: { tipo: "INGRESO", areaId: area.id, fecha: { gte: inicio, lte: fin } },
        }),
        prisma.transaccion.aggregate({
          _sum: { monto: true },
          where: { tipo: "EGRESO", areaId: area.id, fecha: { gte: inicio, lte: fin } },
        }),
      ]);
      ingresoTotal += Number(ing._sum.monto ?? 0);
      egresoTotal += Number(egr._sum.monto ?? 0);
    }
    resultado.push({
      id: area.id,
      nombre: area.nombre,
      ingresoProyectado: ingresoTotal / 3,
      egresoProyectado: egresoTotal / 3,
      margenProyectado: (ingresoTotal - egresoTotal) / 3,
    });
  }

  return resultado.sort((a, b) => b.margenProyectado - a.margenProyectado);
}
