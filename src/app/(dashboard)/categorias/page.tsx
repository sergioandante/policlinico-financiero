import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerTodasLasCategorias } from "@/lib/consultas/categorias";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NuevaCategoriaDialog } from "@/components/transacciones/nueva-categoria-dialog";
import { ToggleCategoriaButton } from "@/components/transacciones/toggle-categoria-button";
import { EliminarCategoriaButton } from "@/components/transacciones/eliminar-categoria-button";

export default async function CategoriasPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarCategorias")) redirect("/dashboard");

  const categorias = await obtenerTodasLasCategorias();
  const ingresos = categorias.filter((c) => c.tipo === "INGRESO");
  const egresos = categorias.filter((c) => c.tipo === "EGRESO");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Categorías</h1>
          <p className="text-sm text-muted-foreground">Categorías de ingreso y egreso usadas en Transacciones.</p>
        </div>
        <div className="flex gap-2">
          <NuevaCategoriaDialog tipo="EGRESO" />
          <NuevaCategoriaDialog tipo="INGRESO" />
        </div>
      </div>

      {[
        { titulo: "Categorías de ingreso", lista: ingresos },
        { titulo: "Categorías de egreso", lista: egresos },
      ].map(({ titulo, lista }) => (
        <Card key={titulo}>
          <CardHeader>
            <CardTitle>{titulo}</CardTitle>
            <CardDescription>{lista.length} categoría(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  {lista === egresos && <TableHead>Tipo de gasto</TableHead>}
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={lista === egresos ? 4 : 3} className="text-center text-muted-foreground py-6">
                      Sin categorías todavía.
                    </TableCell>
                  </TableRow>
                )}
                {lista.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                    {lista === egresos && (
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {c.esFijo ? "Fijo" : "Variable"}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={c.activo ? "success" : "destructive"}>{c.activo ? "Activa" : "Inactiva"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <NuevaCategoriaDialog
                          tipo={c.tipo as "INGRESO" | "EGRESO"}
                          categoria={{ id: c.id, nombre: c.nombre, esFijo: c.esFijo }}
                        />
                        <ToggleCategoriaButton categoriaId={c.id} activo={c.activo} />
                        {!c.enUso && <EliminarCategoriaButton categoriaId={c.id} nombre={c.nombre} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
