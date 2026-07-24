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
