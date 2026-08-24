import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerMetasConProgreso } from "@/lib/consultas/metas";
import { obtenerAreasActivas } from "@/lib/consultas/areas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NuevaMetaDialog } from "@/components/metas/nueva-meta-dialog";
import { formatearMoneda } from "@/lib/utils";
import { Target } from "lucide-react";

const NOMBRES_TIPO: Record<string, string> = {
  INGRESO_MENSUAL: "Ingreso mensual",
  AHORRO: "Ahorro (utilidad)",
  REDUCCION_GASTO: "Tope / reducción de gasto",
};

export default async function MetasPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verMetas")) redirect("/dashboard");

  const [metas, areas] = await Promise.all([obtenerMetasConProgreso(), obtenerAreasActivas()]);
  const puedeEditar = puede(session.user.rol, "editarMetas");
  const hoy = new Date();
  const nombreMes = hoy.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Metas Económicas</h1>
          <p className="text-sm text-muted-foreground capitalize">Progreso de {nombreMes}.</p>
        </div>
        {puedeEditar && <NuevaMetaDialog areas={areas} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metas.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay metas configuradas para este mes.
            </CardContent>
          </Card>
        )}
        {metas.map((m) => (
          <Card key={m.id} className={m.cumple ? "border-ingreso/30" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-600" />
                  {m.nombre}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={m.cumple ? "success" : "warning"}>{m.cumple ? "En camino" : "Por debajo"}</Badge>
                  {puedeEditar && (
                    <NuevaMetaDialog
                      areas={areas}
                      meta={{
                        id: m.id,
                        nombre: m.nombre,
                        tipo: m.tipo,
                        areaId: m.areaId,
                        montoObjetivo: m.montoObjetivo,
                        periodoMes: m.periodoMes,
                        periodoAnio: m.periodoAnio,
                        notas: m.notas,
                      }}
                    />
                  )}
                </div>
              </div>
              <CardDescription>
                {NOMBRES_TIPO[m.tipo]} · {m.area}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                value={Math.min(m.porcentaje, 100)}
                indicatorClassName={m.cumple ? "bg-ingreso" : "bg-alerta"}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {m.tipo === "REDUCCION_GASTO" ? "Tope" : "Objetivo"}
                  </p>
                  <p className="font-tabular font-medium">{formatearMoneda(m.montoObjetivo)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Real del mes</p>
                  <p className="font-tabular font-medium">{formatearMoneda(m.montoReal)}</p>
                </div>
              </div>
              {m.notas && <p className="text-xs text-muted-foreground">{m.notas}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
