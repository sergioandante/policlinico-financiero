import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerReporteDiario } from "@/lib/consultas/reportes";
import { ReporteDiarioChart } from "@/components/dashboard/reporte-diario-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatearMoneda, formatearFecha } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verReportes")) redirect("/dashboard");

  const { desde, hasta } = await searchParams;
  const reporte = await obtenerReporteDiario({ desde, hasta });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reporte de Ingresos y Egresos</h1>
        <p className="text-sm text-muted-foreground">
          Detalle diario del {formatearFecha(reporte.desde)} al {formatearFecha(reporte.hasta)}.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={reporte.desde}
            className="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={reporte.hasta}
            className="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filtrar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard titulo="Total ingresos" valor={reporte.totalIngresos} icon={TrendingUp} tono="ingreso" />
        <KpiCard titulo="Total egresos" valor={reporte.totalEgresos} icon={TrendingDown} tono="egreso" />
        <KpiCard
          titulo="Neto del período"
          valor={reporte.totalNeto}
          icon={DollarSign}
          tono={reporte.totalNeto >= 0 ? "ingreso" : "egreso"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs. Egresos por día</CardTitle>
          <CardDescription>Suma de transacciones registradas cada día del período</CardDescription>
        </CardHeader>
        <CardContent>
          <ReporteDiarioChart data={reporte.diasGrafico} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle diario</CardTitle>
          <CardDescription>Más reciente primero</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Egresos</TableHead>
                <TableHead>Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporte.dias.map((d) => (
                <TableRow key={d.fecha}>
                  <TableCell>{formatearFecha(d.fecha)}</TableCell>
                  <TableCell className="text-ingreso font-tabular">{formatearMoneda(d.ingresos)}</TableCell>
                  <TableCell className="text-egreso font-tabular">{formatearMoneda(d.egresos)}</TableCell>
                  <TableCell className={`font-tabular ${d.neto >= 0 ? "text-ingreso" : "text-egreso"}`}>
                    {formatearMoneda(d.neto)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
