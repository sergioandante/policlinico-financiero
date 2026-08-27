import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Reporte básico de ingresos/egresos por día, para el rango [desde, hasta]
 * (por defecto, los últimos 30 días). Agrupa las Transaccion existentes por
 * fecha calendario, sin tocar Caja/MovimientoCaja: es un reporte de lectura,
 * no afecta la atomicidad de los movimientos de caja.
 */
export async function obtenerReporteDiario(opts?: { desde?: string; hasta?: string }) {
  const hasta = opts?.hasta ? endOfDay(new Date(opts.hasta)) : endOfDay(new Date());
  const desde = opts?.desde ? startOfDay(new Date(opts.desde)) : startOfDay(subDays(hasta, 29));

  const transacciones = await prisma.transaccion.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    select: { tipo: true, monto: true, fecha: true },
    orderBy: { fecha: "asc" },
  });

  // Inicializa un balde por cada día del rango, para que los días sin
  // movimientos también aparezcan en la tabla/gráfico con 0.
  const porDia = new Map<string, { fechaCorta: string; ingresos: number; egresos: number }>();
  for (let d = new Date(desde); d <= hasta; d = new Date(d.getTime() + 86400000)) {
    const key = format(d, "yyyy-MM-dd");
    porDia.set(key, { fechaCorta: format(d, "dd/MM", { locale: es }), ingresos: 0, egresos: 0 });
  }

  for (const t of transacciones) {
    const key = format(t.fecha, "yyyy-MM-dd");
    const bucket = porDia.get(key);
    if (!bucket) continue;
    if (t.tipo === "INGRESO") bucket.ingresos += Number(t.monto);
    else bucket.egresos += Number(t.monto);
  }

  const dias = Array.from(porDia.entries()).map(([fecha, v]) => ({
    fecha,
    fechaCorta: v.fechaCorta,
    ingresos: v.ingresos,
    egresos: v.egresos,
    neto: v.ingresos - v.egresos,
  }));

  const totales = dias.reduce(
    (acc, d) => ({ ingresos: acc.ingresos + d.ingresos, egresos: acc.egresos + d.egresos }),
    { ingresos: 0, egresos: 0 }
  );

  return {
    dias: [...dias].reverse(), // más reciente primero, para la tabla
    diasGrafico: dias, // orden cronológico, para el gráfico
    totalIngresos: totales.ingresos,
    totalEgresos: totales.egresos,
    totalNeto: totales.ingresos - totales.egresos,
    desde: format(desde, "yyyy-MM-dd"),
    hasta: format(hasta, "yyyy-MM-dd"),
  };
}

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Años con al menos una transacción registrada (para el selector del reporte
// mensual); siempre incluye el año actual aunque todavía no tenga datos.
export async function obtenerAniosConDatos() {
  const anioActual = new Date().getFullYear();
  const primera = await prisma.transaccion.findFirst({ orderBy: { fecha: "asc" }, select: { fecha: true } });
  const anioInicio = primera ? Math.min(primera.fecha.getFullYear(), anioActual) : anioActual;

  const anios: number[] = [];
  for (let a = anioActual; a >= anioInicio; a--) anios.push(a);
  return anios;
}

// Reporte de ingresos/egresos agrupado por mes, para un año específico
// (por defecto el actual). Los 12 meses siempre aparecen, aunque no tengan
// movimientos, para que el gráfico se vea completo todo el año.
export async function obtenerReporteMensual(opts?: { anio?: number }) {
  const anio = opts?.anio ?? new Date().getFullYear();
  const desde = new Date(anio, 0, 1);
  const hasta = new Date(anio, 11, 31, 23, 59, 59, 999);

  const transacciones = await prisma.transaccion.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    select: { tipo: true, monto: true, fecha: true },
  });

  const meses = MESES_CORTOS.map((mes) => ({ mes, ingresos: 0, egresos: 0 }));
  for (const t of transacciones) {
    const bucket = meses[t.fecha.getMonth()];
    if (t.tipo === "INGRESO") bucket.ingresos += Number(t.monto);
    else bucket.egresos += Number(t.monto);
  }

  const totales = meses.reduce(
    (acc, m) => ({ ingresos: acc.ingresos + m.ingresos, egresos: acc.egresos + m.egresos }),
    { ingresos: 0, egresos: 0 }
  );

  return {
    meses,
    anio,
    totalIngresos: totales.ingresos,
    totalEgresos: totales.egresos,
    totalNeto: totales.ingresos - totales.egresos,
  };
}

// Reporte de ingresos/egresos agrupado por año, con todo el historial
// disponible — para ver la tendencia de un año a otro.
export async function obtenerReporteAnual() {
  const transacciones = await prisma.transaccion.findMany({ select: { tipo: true, monto: true, fecha: true } });

  const porAnio = new Map<number, { ingresos: number; egresos: number }>();
  for (const t of transacciones) {
    const anio = t.fecha.getFullYear();
    if (!porAnio.has(anio)) porAnio.set(anio, { ingresos: 0, egresos: 0 });
    const bucket = porAnio.get(anio)!;
    if (t.tipo === "INGRESO") bucket.ingresos += Number(t.monto);
    else bucket.egresos += Number(t.monto);
  }

  if (porAnio.size === 0) porAnio.set(new Date().getFullYear(), { ingresos: 0, egresos: 0 });

  const anios = Array.from(porAnio.keys()).sort((a, b) => a - b);
  const datos = anios.map((anio) => ({
    mes: String(anio),
    ingresos: porAnio.get(anio)!.ingresos,
    egresos: porAnio.get(anio)!.egresos,
  }));

  const totales = datos.reduce(
    (acc, d) => ({ ingresos: acc.ingresos + d.ingresos, egresos: acc.egresos + d.egresos }),
    { ingresos: 0, egresos: 0 }
  );

  return {
    datos,
    totalIngresos: totales.ingresos,
    totalEgresos: totales.egresos,
    totalNeto: totales.ingresos - totales.egresos,
  };
}
