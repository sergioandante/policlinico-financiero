import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

// Proyección de ingresos y egresos futuros — heurística simple a propósito
// (promedio móvil + tendencia lineal básica), igual de espíritu que la
// detección de anomalías del dashboard: da una primera estimación útil sin
// pretender ser un modelo econométrico. Se puede perfeccionar más adelante.

const MESES_HISTORIAL = 6;

// Trae las transacciones de los últimos MESES_HISTORIAL meses en una sola
// consulta y las agrupa por mes en memoria. Antes esto se hacía con una
// consulta aggregate() por cada mes y por cada serie (6 viajes a la base de
// datos, uno tras otro); con la base de datos en la nube, esa latencia
// acumulada es justo lo que hacía lenta (o directamente hacía fallar por
// tiempo de espera) la página de Proyecciones.
async function calcularSeriesMensuales() {
  const ahora = new Date();
  const inicioRango = startOfMonth(subMonths(ahora, MESES_HISTORIAL - 1));
  const finRango = endOfMonth(ahora);

  const transacciones = await prisma.transaccion.findMany({
    where: { fecha: { gte: inicioRango, lte: finRango } },
    select: { tipo: true, monto: true, fecha: true, categoria: { select: { esFijo: true } } },
  });

  const buckets = Array.from({ length: MESES_HISTORIAL }, (_, idx) => {
    const mes = subMonths(ahora, MESES_HISTORIAL - 1 - idx);
    return {
      mes: format(mes, "MMM yyyy", { locale: es }),
      inicio: startOfMonth(mes),
      fin: endOfMonth(mes),
      ingreso: 0,
      egresoFijo: 0,
      egresoVariable: 0,
    };
  });

  for (const t of transacciones) {
    const bucket = buckets.find((b) => t.fecha >= b.inicio && t.fecha <= b.fin);
    if (!bucket) continue;
    const monto = Number(t.monto);
    if (t.tipo === "INGRESO") bucket.ingreso += monto;
    else if (t.categoria.esFijo) bucket.egresoFijo += monto;
    else bucket.egresoVariable += monto;
  }

  return {
    serieIngresos: buckets.map((b) => ({ mes: b.mes, monto: b.ingreso })),
    serieEgresosFijos: buckets.map((b) => ({ mes: b.mes, monto: b.egresoFijo })),
    serieEgresosVariables: buckets.map((b) => ({ mes: b.mes, monto: b.egresoVariable })),
  };
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
  const { serieIngresos, serieEgresosFijos, serieEgresosVariables } = await calcularSeriesMensuales();

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
// Una sola consulta trae todas las transacciones del rango (antes eran 14
// áreas × 3 meses × 2 consultas = 84 viajes secuenciales a la base de datos).
export async function obtenerProyeccionPorArea() {
  const ahora = new Date();
  const inicioRango = startOfMonth(subMonths(ahora, 2));
  const finRango = endOfMonth(ahora);

  const [areas, transacciones] = await Promise.all([
    prisma.area.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.transaccion.findMany({
      where: { fecha: { gte: inicioRango, lte: finRango }, areaId: { not: null } },
      select: { tipo: true, monto: true, areaId: true },
    }),
  ]);

  const totalesPorArea = new Map<string, { ingreso: number; egreso: number }>();
  for (const t of transacciones) {
    if (!t.areaId) continue;
    const bucket = totalesPorArea.get(t.areaId) ?? { ingreso: 0, egreso: 0 };
    if (t.tipo === "INGRESO") bucket.ingreso += Number(t.monto);
    else bucket.egreso += Number(t.monto);
    totalesPorArea.set(t.areaId, bucket);
  }

  const resultado = areas.map((area) => {
    const totales = totalesPorArea.get(area.id) ?? { ingreso: 0, egreso: 0 };
    return {
      id: area.id,
      nombre: area.nombre,
      ingresoProyectado: totales.ingreso / 3,
      egresoProyectado: totales.egreso / 3,
      margenProyectado: (totales.ingreso - totales.egreso) / 3,
    };
  });

  return resultado.sort((a, b) => b.margenProyectado - a.margenProyectado);
}
