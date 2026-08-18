import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerInventario } from "@/lib/consultas/inventario";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NuevoItemDialog } from "@/components/inventario/nuevo-item-dialog";
import { AjustarStockDialog } from "@/components/inventario/ajustar-stock-dialog";
import { ExportarExcelButton } from "@/components/shared/exportar-excel-button";
import { formatearFecha } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function InventarioPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verInventario")) redirect("/dashboard");

  const items = await obtenerInventario();
  const puedeEditar = puede(session.user.rol, "editarInventario");
  const puedeExportar = puede(session.user.rol, "exportarExcel");
  const alertas = items.filter((i) => i.stockBajo || i.porVencer);

  const filasExportar = items.map((i) => ({
    Codigo: i.codigo,
    Concepto: i.nombre,
    Categoria: i.categoria,
    Cantidad: i.stockActual,
    UnidadMedida: i.unidadMedida,
    StockMinimo: i.stockMinimo,
    Vencimiento: i.fechaVencimiento ? formatearFecha(i.fechaVencimiento) : "",
    Estado: i.stockBajo ? "Stock bajo" : i.porVencer ? "Por vencer" : "OK",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Inventario</h1>
          <p className="text-sm text-muted-foreground">Vacunas, suplementos e insumos médicos.</p>
        </div>
        <div className="flex gap-2">
          {puedeExportar && (
            <ExportarExcelButton data={filasExportar} nombreArchivo="inventario" hojaNombre="Inventario" />
          )}
          {puedeEditar && <NuevoItemDialog />}
        </div>
      </div>

      {alertas.length > 0 && (
        <Card className="border-alerta/40 bg-alerta-bg/40">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 font-medium text-alerta mb-2">
              <AlertTriangle className="w-4 h-4" />
              {alertas.length} ítem(s) requieren atención
            </div>
            <ul className="text-sm space-y-1 text-ink">
              {alertas.map((i) => (
                <li key={i.id}>
                  <span className="font-medium">{i.nombre}</span>
                  {i.stockBajo && ` — stock bajo (${i.stockActual}/${i.stockMinimo})`}
                  {i.porVencer && i.fechaVencimiento && ` — vence el ${formatearFecha(i.fechaVencimiento)}`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todos los ítems</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock actual</TableHead>
                <TableHead>Stock mínimo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                {puedeEditar && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{i.codigo}</TableCell>
                  <TableCell className="font-medium text-sm">{i.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.categoria}</TableCell>
                  <TableCell className="text-sm font-tabular">
                    {i.stockActual} {i.unidadMedida}
                  </TableCell>
                  <TableCell className="text-sm font-tabular text-muted-foreground">{i.stockMinimo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {i.fechaVencimiento ? formatearFecha(i.fechaVencimiento) : "—"}
                  </TableCell>
                  <TableCell>
                    {i.stockBajo && <Badge variant="destructive">Stock bajo</Badge>}
                    {i.porVencer && !i.stockBajo && <Badge variant="warning">Por vencer</Badge>}
                    {!i.stockBajo && !i.porVencer && <Badge variant="success">OK</Badge>}
                  </TableCell>
                  {puedeEditar && (
                    <TableCell>
                      <AjustarStockDialog itemId={i.id} nombre={i.nombre} />
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
