import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede, rutaInicioParaRol } from "@/lib/permisos";
import { obtenerResumenDashboard, obtenerPresupuestosActivos } from "@/lib/consultas/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { IngresosEgresosChart } from "@/components/dashboard/ingresos-egresos-chart";
import { FlujoCajaChart } from "@/components/dashboard/flujo-caja-chart";
import { CajaBalanceCard } from "@/components/cajas/caja-balance-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFecha } from "@/lib/utils";
import { DollarSign, TrendingDown, TrendingUp, Wallet2, AlertTriangle, CalendarClock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!puede(session.user.rol, "verDashboard")) redirect(rutaInicioParaRol(session.user.rol));

  const [resumen, presupuestos] = await Promise.all([
    obtenerResumenDashboard(),
    obtenerPresupuestosActivos(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard Administrativo</h1>
        <p className="text-sm text-muted-foreground">Resumen financiero del mes en curso.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard titulo="Ingresos del mes" valor={resumen.ingresosMes} icon={TrendingUp} tono="ingreso" />
        <KpiCard titulo="Egresos del mes" valor={resumen.egresosMes} icon={TrendingDown} tono="egreso" />
        <KpiCard
          titulo="Utilidad del mes"
          valor={resumen.utilidadMes}
          icon={DollarSign}
          subtitulo={`Margen: ${resumen.margenMes.toFixed(1)}%`}
          tono={resumen.utilidadMes >= 0 ? "ingreso" : "egreso"}
        />
        <KpiCard titulo="Saldo total en cajas" valor={resumen.saldoCajas} icon={Wallet2} />
      </div>

      {/* Resumen de cajas + reporte del día — lo primero que la administradora quiere ver al entrar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resumen.cajas.map((c) => (
            <CajaBalanceCard key={c.id} nombre={c.nombre} tipo={c.tipo} saldo={c.saldo} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-brand-600" />
              Reporte del día
            </CardTitle>
            <CardDescription>{formatearFecha(new Date())}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingresos de hoy</span>
              <span className="font-tabular font-medium text-ingreso">{formatearMoneda(resumen.reporteHoy.ingresos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Egresos de hoy</span>
              <span className="font-tabular font-medium text-egreso">{formatearMoneda(resumen.reporteHoy.egresos)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-medium">Neto de hoy</span>
              <span
                className={`font-tabular font-bold ${resumen.reporteHoy.neto >= 0 ? "text-ingreso" : "text-egreso"}`}
              >
                {formatearMoneda(resumen.reporteHoy.neto)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráficos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs. Egresos</CardTitle>
            <CardDescription>Comparativo de los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <IngresosEgresosChart data={resumen.dataMensual} />
          </CardContent>
        </Card>

        {/* Alertas de anomalías */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-alerta">
              <AlertTriangle className="w-4 h-4" />
              Egresos inusuales
            </CardTitle>
            <CardDescription>Montos que superan 2.5x el promedio de su categoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumen.anomalias.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin anomalías detectadas este mes. ✅</p>
            )}
            {resumen.anomalias.map((a) => (
              <div key={a.id} className="rounded-md border border-alerta/30 bg-alerta-bg p-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>{a.categoria}</span>
                  <span className="font-tabular">{formatearMoneda(a.monto)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.descripcion}</p>
                <p className="text-xs text-alerta mt-1">
                  Promedio habitual: {formatearMoneda(a.promedioCategoria)} · {formatearFecha(a.fecha)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Flujo de caja acumulado</CardTitle>
            <CardDescription>Movimientos de los últimos 30 días (ambas cajas)</CardDescription>
          </CardHeader>
          <CardContent>
            <FlujoCajaChart data={resumen.flujoAcumulado} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presupuestos del mes</CardTitle>
            <CardDescription>Ejecución vs. lo asignado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {presupuestos.map((p) => {
              const sobrepasado = p.porcentaje >= 100;
              const enAlerta = p.porcentaje >= p.umbralAlerta;
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.area}</span>
                    <Badge variant={sobrepasado ? "destructive" : enAlerta ? "warning" : "secondary"}>
                      {p.porcentaje.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min(p.porcentaje, 100)}
                    indicatorClassName={sobrepasado ? "bg-egreso" : enAlerta ? "bg-alerta" : "bg-brand-600"}
                  />
                  <p className="text-xs text-muted-foreground font-tabular">
                    {formatearMoneda(p.montoGastado)} de {formatearMoneda(p.montoAsignado)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
