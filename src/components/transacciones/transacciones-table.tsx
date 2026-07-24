import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFecha } from "@/lib/utils";

type Transaccion = {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  categoria: string;
  descripcion: string;
  metodoPago: string;
  origen: string;
  usuario: string;
};

const METODOS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  YAPE_PLIN: "Yape/Plin",
  OTRO: "Otro",
};

export function TransaccionesTable({ transacciones }: { transacciones: Transaccion[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Registrado por</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transacciones.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
            <TableCell className="text-sm">{t.categoria}</TableCell>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
