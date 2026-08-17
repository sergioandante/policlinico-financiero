import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { AREA_LABELS, type Area } from "@/lib/clasificacion-areas";

export async function obtenerResumenDashboard() {
  const ahora = new Date();
  const inicioMes = startOfMonth(ahora);
  const finMes = endOfMonth(ahora);

  const [ingresosMesAgg, egresosMesAgg, cajas] = await Promise.all([
    prisma.transaccion.aggregate({
      _sum: { monto: true },
      where: { tipo: "INGRESO", fecha: { gte: inicioMes, lte: finMes } },
    }),
    prisma.transaccion.aggregate({
      _sum: { monto: true },
      where: { tipo: "EGRESO", fecha: { gte: inicioMes, lte: finMes } },
    }),
    prisma.caja.findMany(),
  ]);

  const ingresosMes = Number(ingresosMesAgg._sum.monto ?? 0);
  const egresosMes = Number(egresosMesAgg._sum.monto ?? 0);
  const saldoCajas = cajas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

  // Serie mensual histórica (últimos 12 meses) para el gráfico de tendencia
  // general. A propósito NO se desglosa por área en meses pasados (para no
  // saturar el histórico con demasiado detalle) — solo se grafican los
  // valores brutos de facturación, marcando el mes con más ingresos como
  // "pico". El desglose por área/especialidad solo aplica al mes en curso
  // (ver ingresosPorArea más abajo).
  const dataMensual = [];
  for (let i = 11; i >= 0; i--) {
    const mes = subMonths(ahora, i);
    const inicio = startOfMonth(mes);
    const fin = endOfMonth(mes);
    const [ingresos, egresos] = await Promise.all([
      prisma.transaccion.aggregate({ _sum: { monto: true }, where: { tipo: "INGRESO", fecha: { gte: inicio, lte: fin } } }),
      prisma.transaccion.aggregate({ _sum: { monto: true }, where: { tipo: "EGRESO", fecha: { gte: inicio, lte: fin } } }),
    ]);
    dataMensual.push({
      mes: format(mes, "MMM", { locale: es }),
      ingresos: Number(ingresos._sum.monto ?? 0),
      egresos: Number(egresos._sum.monto ?? 0),
      esMesActual: i === 0,
    });
  }
  const picoIngresosMes = dataMensual.reduce((max, m) => (m.ingresos > max.ingresos ? m : max), dataMensual[0]);

  // Desglose de ingresos por área/especialidad — solo del mes en curso.
  const ingresosDelMes = await prisma.transaccion.findMany({
    where: { tipo: "INGRESO", fecha: { gte: inicioMes, lte: finMes } },
    select: { area: true, subclaseBP: true, monto: true, posiblePagoMultiple: true },
  });
  const totalesPorArea = new Map<Area, number>();
  const subclasesBP = { CONSULTA: 0, PAQUETE: 0, REVISAR: 0 } as Record<string, number>;
  let pagosMultiplesDetectados = 0;
  for (const t of ingresosDelMes) {
    const area = (t.area ?? "OTROS") as Area;
    totalesPorArea.set(area, (totalesPorArea.get(area) ?? 0) + Number(t.monto));
    if (area === "BP" && t.subclaseBP) subclasesBP[t.subclaseBP] += Number(t.monto);
    if (t.posiblePagoMultiple) pagosMultiplesDetectados++;
  }
  const ingresosPorArea = Array.from(totalesPorArea.entries())
    .map(([area, total]) => ({ area, label: AREA_LABELS[area], total }))
    .sort((a, b) => b.total - a.total);

  // Flujo de caja acumulado (últimos 30 días) usando movimientos_caja
  const movimientos = await prisma.movimientoCaja.findMany({
    where: { fecha: { gte: subMonths(ahora, 1) } },
    orderBy: { fecha: "asc" },
  });
  let acumulado = 0;
  const flujoDiario = new Map<string, number>();
  for (const m of movimientos) {
    const esEntrada = m.tipo === "INGRESO" || m.tipo === "TRASPASO_ENTRADA";
    acumulado += esEntrada ? Number(m.monto) : -Number(m.monto);
    const key = format(m.fecha, "dd/MM");
    flujoDiario.set(key, acumulado);
  }
  const flujoAcumulado = Array.from(flujoDiario.entries()).map(([fecha, saldo]) => ({ fecha, saldo }));

  // Detección simple de anomalías: egresos individuales que superan
  // en 2.5x el promedio histórico de su categoría.
  const egresosPorCategoria = await prisma.transaccion.groupBy({
    by: ["categoriaId"],
    where: { tipo: "EGRESO" },
    _avg: { monto: true },
  });
  const promedioPorCategoria = new Map(egresosPorCategoria.map((e) => [e.categoriaId, Number(e._avg.monto ?? 0)]));

  const egresosRecientes = await prisma.transaccion.findMany({
    where: { tipo: "EGRESO", fecha: { gte: subMonths(ahora, 1) } },
    include: { categoria: true },
    orderBy: { fecha: "desc" },
  });

  const anomalias = egresosRecientes
    .filter((t) => {
      const prom = promedioPorCategoria.get(t.categoriaId) ?? 0;
      return prom > 0 && Number(t.monto) > prom * 2.5;
    })
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      categoria: t.categoria.nombre,
      monto: Number(t.monto),
      promedioCategoria: promedioPorCategoria.get(t.categoriaId) ?? 0,
      fecha: t.fecha,
    }));

  const utilidadMes = ingresosMes - egresosMes;
  const margenMes = ingresosMes > 0 ? (utilidadMes / ingresosMes) * 100 : 0;

  return {
    ingresosMes,
    egresosMes,
    utilidadMes,
    margenMes,
    saldoCajas,
    cajas: cajas.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, saldo: Number(c.saldoActual) })),
    dataMensual,
    picoIngresosMes,
    flujoAcumulado,
    anomalias,
    ingresosPorArea,
    subclasesBP,
    pagosMultiplesDetectados,
  };
}

export async function obtenerPresupuestosActivos() {
  const ahora = new Date();
  const presupuestos = await prisma.presupuesto.findMany({
    where: { periodoMes: ahora.getMonth() + 1, periodoAnio: ahora.getFullYear() },
    include: { categoria: true },
  });

  const inicioMes = startOfMonth(ahora);
  const finMes = endOfMonth(ahora);

  const resultado = [];
  for (const p of presupuestos) {
    const gastado = await prisma.transaccion.aggregate({
      _sum: { monto: true },
      where: { categoriaId: p.categoriaId, tipo: "EGRESO", fecha: { gte: inicioMes, lte: finMes } },
    });
    const montoGastado = Number(gastado._sum.monto ?? 0);
    const montoAsignado = Number(p.montoAsignado);
    resultado.push({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria.nombre,
      montoAsignado,
      montoGastado,
      porcentaje: montoAsignado > 0 ? (montoGastado / montoAsignado) * 100 : 0,
      umbralAlerta: p.umbralAlerta,
    });
  }
  return resultado;
}
