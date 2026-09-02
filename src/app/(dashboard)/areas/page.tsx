import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerResumenPorArea } from "@/lib/consultas/areas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NuevaAreaDialog } from "@/components/areas/nueva-area-dialog";
import { ToggleAreaButton } from "@/components/areas/toggle-area-button";
import { EliminarAreaButton } from "@/components/areas/eliminar-area-button";
import { formatearMoneda } from "@/lib/utils";

export default async function AreasPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verAreas")) redirect("/dashboard");

  const areas = await obtenerResumenPorArea();
  const puedeEditar = puede(session.user.rol, "editarAreas");
  const hoy = new Date();
  const nombreMes = hoy.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  const areasOrdenadas = [...areas].sort((a, b) => b.margen - a.margen);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Áreas</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Cuánto genera y cuánto gasta cada área en {nombreMes} — margen = ingreso - egreso.
          </p>
        </div>
        {puedeEditar && <NuevaAreaDialog />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rentabilidad por área (mes en curso)</CardTitle>
          <CardDescription>Ordenado de mayor a menor margen — útil para decidir a quién asignar más presupuesto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ingreso</TableHead>
                <TableHead className="text-right">Egreso</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead>Estado</TableHead>
                {puedeEditar && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areasOrdenadas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm font-medium">{a.nombre}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.tipo === "CLINICA" ? "Clínica" : "Administrativa"}
                  </TableCell>
                  <TableCell className="text-right font-tabular text-ingreso">{formatearMoneda(a.ingreso)}</TableCell>
                  <TableCell className="text-right font-tabular text-egreso">{formatearMoneda(a.egreso)}</TableCell>
                  <TableCell
                    className={`text-right font-tabular font-medium ${a.margen >= 0 ? "text-ingreso" : "text-egreso"}`}
                  >
                    {formatearMoneda(a.margen)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.activo ? "success" : "destructive"}>{a.activo ? "Activa" : "Inactiva"}</Badge>
                  </TableCell>
                  {puedeEditar && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <NuevaAreaDialog area={{ id: a.id, nombre: a.nombre, tipo: a.tipo }} />
                        <ToggleAreaButton areaId={a.id} activo={a.activo} />
                        <EliminarAreaButton areaId={a.id} nombre={a.nombre} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
