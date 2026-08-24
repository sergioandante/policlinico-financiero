import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerTransacciones, obtenerCategorias } from "@/lib/consultas/transacciones";
import { obtenerCajas } from "@/lib/consultas/cajas";
import { obtenerAreasActivas } from "@/lib/consultas/areas";
import { TransaccionesTable } from "@/components/transacciones/transacciones-table";
import { TransaccionDialog } from "@/components/transacciones/transaccion-dialog";
import { ExportarExcelButton } from "@/components/shared/exportar-excel-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { formatearFecha } from "@/lib/utils";

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; categoriaId?: string; areaId?: string; desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verTransacciones")) redirect("/dashboard");

  const filtros = await searchParams;
  const [transacciones, categorias, cajas, areas] = await Promise.all([
    obtenerTransacciones(filtros),
    obtenerCategorias(),
    obtenerCajas(),
    obtenerAreasActivas(),
  ]);
  const puedeCrear = puede(session.user.rol, "crearTransacciones");
  const puedeEditar = puede(session.user.rol, "editarTransacciones");
  const puedeExportar = puede(session.user.rol, "exportarExcel");

  const filasExportar = transacciones.map((t) => ({
    Fecha: formatearFecha(t.fecha),
    Tipo: t.tipo === "INGRESO" ? "Ingreso" : "Egreso",
    Categoria: t.categoria,
    Area: t.area ?? "",
    Monto: t.monto,
    Descripcion: t.descripcion,
    MetodoPago: t.metodoPago,
    RegistradoPor: t.usuario,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Transacciones Financieras</h1>
          <p className="text-sm text-muted-foreground">Ingresos y egresos detallados del policlínico.</p>
        </div>
        <div className="flex gap-2">
          {puedeExportar && (
            <ExportarExcelButton data={filasExportar} nombreArchivo="transacciones" hojaNombre="Transacciones" />
          )}
          {puedeCrear && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/transacciones/importar">
                  <FileSpreadsheet className="w-4 h-4" />
                  Importar Excel
                </Link>
              </Button>
              <TransaccionDialog categorias={categorias} cajas={cajas} areas={areas} />
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select name="tipo" defaultValue={filtros.tipo ?? ""} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <select name="categoriaId" defaultValue={filtros.categoriaId ?? ""} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Área</label>
              <select name="areaId" defaultValue={filtros.areaId ?? ""} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Todas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <input type="date" name="desde" defaultValue={filtros.desde} className="h-9 rounded-md border border-input bg-white px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <input type="date" name="hasta" defaultValue={filtros.hasta} className="h-9 rounded-md border border-input bg-white px-3 text-sm" />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Filtrar
            </Button>
          </form>

          <TransaccionesTable
            transacciones={transacciones}
            categorias={categorias}
            cajas={cajas}
            areas={areas}
            puedeEditar={puedeEditar}
          />
        </CardContent>
      </Card>
    </div>
  );
}
