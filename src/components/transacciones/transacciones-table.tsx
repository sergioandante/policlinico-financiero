import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFecha } from "@/lib/utils";
import { TransaccionDialog } from "@/components/transacciones/transaccion-dialog";
import { EliminarTransaccionButton } from "@/components/transacciones/eliminar-transaccion-button";

type Transaccion = {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  categoriaId: string;
  categoria: string;
  esFijo: boolean;
  areaId: string | null;
  area: string | null;
  descripcion: string;
  metodoPago: string;
  comprobante: string | null;
  proveedorOCliente: string | null;
  cajaId: string | null;
  origen: string;
  usuario: string;
};
type Categoria = { id: string; nombre: string; tipo: string; parentId: string | null };
type Caja = { id: string; nombre: string };
type Area = { id: string; nombre: string };

const METODOS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  YAPE_PLIN: "Yape/Plin",
  OTRO: "Otro",
};

export function TransaccionesTable({
  transacciones,
  categorias,
  cajas,
  areas,
  puedeEditar,
  autoAbrirId,
}: {
  transacciones: Transaccion[];
  categorias: Categoria[];
  cajas: Caja[];
  areas: Area[];
  puedeEditar: boolean;
  autoAbrirId?: string;
}) {
  const columnas = puedeEditar ? 9 : 8;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Registrado por</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          {puedeEditar && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transacciones.length === 0 && (
          <TableRow>
            <TableCell colSpan={columnas} className="text-center text-muted-foreground py-8">
              No hay transacciones para los filtros seleccionados.
            </TableCell>
          </TableRow>
        )}
        {transacciones.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatearFecha(t.fecha)}</TableCell>
            <TableCell>
              <Badge variant={t.tipo === "INGRESO" ? "success" : "destructive"}>
                {t.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">
              {t.categoria}
              {t.tipo === "EGRESO" && (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {t.esFijo ? "Fijo" : "Variable"}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{t.area ?? "—"}</TableCell>
            <TableCell className="text-sm max-w-xs truncate">
              {t.descripcion}
              {t.origen === "IMPORTACION_EXCEL" && (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Excel
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{METODOS[t.metodoPago]}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{t.usuario}</TableCell>
            <TableCell
              className={`text-right font-tabular font-medium ${t.tipo === "INGRESO" ? "text-ingreso" : "text-egreso"}`}
            >
              {t.tipo === "INGRESO" ? "+" : "-"}
              {formatearMoneda(t.monto)}
            </TableCell>
            {puedeEditar && (
              <TableCell>
                <div className="flex items-center gap-0.5">
                  <TransaccionDialog
                    categorias={categorias}
                    cajas={cajas}
                    areas={areas}
                    transaccion={t}
                    autoAbrir={t.id === autoAbrirId}
                  />
                  <EliminarTransaccionButton transaccionId={t.id} />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
