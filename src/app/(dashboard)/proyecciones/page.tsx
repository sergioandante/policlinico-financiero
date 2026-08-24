import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerProyeccionConsolidada, obtenerProyeccionPorArea } from "@/lib/consultas/proyecciones";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProyeccionChart } from "@/components/proyecciones/proyeccion-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatearMoneda } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Info } from "lucide-react";

export default async function ProyeccionesPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verProyecciones")) redirect("/dashboard");

  const [consolidado, porArea] = await Promise.all([
    obtenerProyeccionConsolidada(),
    obtenerProyeccionPorArea(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink capitalize">
          Proyección de ingresos y egresos — {consolidado.proximoMes}
        </h1>
        <p className="text-sm text-muted-foreground">
          Estimación basada en el promedio de los últimos 3 meses más la tendencia de los últimos 6.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Ingresos proyectados" valor={consolidado.ingresos.proyeccion} icon={TrendingUp} tono="ingreso" />
        <KpiCard
          titulo="Egresos fijos proyectados"
          valor={consolidado.egresosFijos.proyeccion}
          icon={TrendingDown}
          tono="egreso"
        />
        <KpiCard
          titulo="Egresos variables proyectados"
          valor={consolidado.egresosVariables.proyeccion}
          icon={TrendingDown}
          tono="egreso"
        />
        <KpiCard
          titulo="Utilidad proyectada"
          valor={consolidado.utilidadProyectada}
          icon={DollarSign}
          tono={consolidado.utilidadProyectada >= 0 ? "ingreso" : "egreso"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico y proyección</CardTitle>
          <CardDescription>Últimos {consolidado.serieCombinada.length} meses — ingresos, egresos fijos y variables</CardDescription>
        </CardHeader>
        <CardContent>
          <ProyeccionChart data={consolidado.serieCombinada} />
        </CardContent>
      </Card>

      <Card className="border-brand-200 bg-brand-50/40">
        <CardContent className="pt-5 flex gap-3 text-sm text-ink">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
          <p>
            Rango histórico de egresos variables: {formatearMoneda(consolidado.egresosVariables.minimo)} —{" "}
            {formatearMoneda(consolidado.egresosVariables.maximo)} en los últimos {consolidado.serieCombinada.length}{" "}
            meses. Los egresos fijos son más estables (planilla, alquiler, servicios) por eso su rango es más
            angosto: {formatearMoneda(consolidado.egresosFijos.minimo)} — {formatearMoneda(consolidado.egresosFijos.maximo)}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proyección por área (próximo mes)</CardTitle>
          <CardDescription>Promedio de los últimos 3 meses de cada área, ordenado por margen proyectado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead className="text-right">Ingreso proyectado</TableHead>
                <TableHead className="text-right">Egreso proyectado</TableHead>
                <TableHead className="text-right">Margen proyectado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porArea.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm font-medium">{a.nombre}</TableCell>
                  <TableCell className="text-right font-tabular text-ingreso">
                    {formatearMoneda(a.ingresoProyectado)}
                  </TableCell>
                  <TableCell className="text-right font-tabular text-egreso">
                    {formatearMoneda(a.egresoProyectado)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-tabular font-medium ${a.margenProyectado >= 0 ? "text-ingreso" : "text-egreso"}`}
                  >
                    {formatearMoneda(a.margenProyectado)}
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
