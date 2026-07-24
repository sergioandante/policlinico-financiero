import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerTransacciones, obtenerCategorias } from "@/lib/consultas/transacciones";
import { obtenerCajas } from "@/lib/consultas/cajas";
import { TransaccionesTable } from "@/components/transacciones/transacciones-table";
import { TransaccionDialog } from "@/components/transacciones/transaccion-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; categoriaId?: string; desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verTransacciones")) redirect("/dashboard");

  const filtros = await searchParams;
  const [transacciones, categorias, cajas] = await Promise.all([
    obtenerTransacciones(filtros),
    obtenerCategorias(),
    obtenerCajas(),
  ]);
  const puedeCrear = puede(session.user.rol, "crearTransacciones");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Transacciones Financieras</h1>
          <p className="text-sm text-muted-foreground">Ingresos y egresos detallados del policlínico.</p>
        </div>
        {puedeCrear && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/transacciones/importar">
                <FileSpreadsheet className="w-4 h-4" />
                Importar Excel
              </Link>
            </Button>
            <TransaccionDialog categorias={categorias} cajas={cajas} />
          </div>
        )}
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

          <TransaccionesTable transacciones={transacciones} />
        </CardContent>
      </Card>
    </div>
  );
}
