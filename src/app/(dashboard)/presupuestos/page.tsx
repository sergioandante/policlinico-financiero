import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerPresupuestosActivos } from "@/lib/consultas/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda } from "@/lib/utils";
import { AlertTriangle, PiggyBank } from "lucide-react";
import { NuevoPresupuestoDialog } from "@/components/presupuestos/nuevo-presupuesto-dialog";
import { obtenerAreasActivas } from "@/lib/consultas/areas";

export default async function PresupuestosPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verPresupuestos")) redirect("/dashboard");

  const [presupuestos, areas] = await Promise.all([
    obtenerPresupuestosActivos(),
    obtenerAreasActivas(),
  ]);
  const puedeEditar = puede(session.user.rol, "editarPresupuestos");
  const hoy = new Date();
  const nombreMes = hoy.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Presupuestos</h1>
          <p className="text-sm text-muted-foreground capitalize">Ejecución de {nombreMes} por área.</p>
        </div>
        {puedeEditar && <NuevoPresupuestoDialog areas={areas} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presupuestos.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay presupuestos configurados para este mes.
            </CardContent>
          </Card>
        )}
        {presupuestos.map((p) => {
          const sobrepasado = p.porcentaje >= 100;
          const enAlerta = p.porcentaje >= p.umbralAlerta;
          const disponible = p.montoAsignado - p.montoGastado;
          return (
            <Card key={p.id} className={sobrepasado ? "border-egreso/40" : enAlerta ? "border-alerta/40" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-brand-600" />
                    {p.area}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {(sobrepasado || enAlerta) && (
                      <Badge variant={sobrepasado ? "destructive" : "warning"}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {sobrepasado ? "Presupuesto superado" : "Cerca del límite"}
                      </Badge>
                    )}
                    {puedeEditar && (
                      <NuevoPresupuestoDialog
                        areas={areas}
                        presupuesto={{
                          id: p.id,
                          nombre: p.nombre,
                          areaId: p.areaId,
                          montoAsignado: p.montoAsignado,
                          periodoMes: p.periodoMes,
                          periodoAnio: p.periodoAnio,
                          umbralAlerta: p.umbralAlerta,
                        }}
                      />
                    )}
                  </div>
                </div>
                <CardDescription>{p.nombre}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={Math.min(p.porcentaje, 100)}
                  indicatorClassName={sobrepasado ? "bg-egreso" : enAlerta ? "bg-alerta" : "bg-brand-600"}
                />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Asignado</p>
                    <p className="font-tabular font-medium">{formatearMoneda(p.montoAsignado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gastado</p>
                    <p className="font-tabular font-medium">{formatearMoneda(p.montoGastado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{disponible >= 0 ? "Disponible" : "Excedido"}</p>
                    <p className={`font-tabular font-medium ${disponible >= 0 ? "text-ingreso" : "text-egreso"}`}>
                      {formatearMoneda(Math.abs(disponible))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
