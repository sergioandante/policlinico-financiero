import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFechaHora } from "@/lib/utils";

const ETIQUETAS: Record<string, { texto: string; variant: any }> = {
  INGRESO: { texto: "Ingreso", variant: "success" },
  EGRESO: { texto: "Egreso", variant: "destructive" },
  TRASPASO_SALIDA: { texto: "Traspaso (salida)", variant: "warning" },
  TRASPASO_ENTRADA: { texto: "Traspaso (entrada)", variant: "warning" },
  RETIRO: { texto: "Retiro", variant: "destructive" },
  ADELANTO_SUELDO: { texto: "Adelanto sueldo", variant: "destructive" },
};

type Movimiento = {
  id: string;
  caja: string;
  cajaDestino: string | null;
  tipo: string;
  monto: number;
  descripcion: string;
  beneficiario: string | null;
  usuario: string;
  fecha: Date;
  saldoNuevo: number;
};

export function MovimientosTable({ movimientos }: { movimientos: Movimiento[] }) {
  const esEntrada = (tipo: string) => tipo === "INGRESO" || tipo === "TRASPASO_ENTRADA";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Caja</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Saldo resultante</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              No hay movimientos para los filtros seleccionados.
            </TableCell>
          </TableRow>
        )}
        {movimientos.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {formatearFechaHora(m.fecha)}
            </TableCell>
            <TableCell className="text-sm font-medium">{m.caja}</TableCell>
            <TableCell>
              <Badge variant={ETIQUETAS[m.tipo]?.variant ?? "secondary"}>{ETIQUETAS[m.tipo]?.texto ?? m.tipo}</Badge>
            </TableCell>
            <TableCell className="text-sm max-w-xs truncate">
              {m.descripcion}
              {m.beneficiario && <span className="text-muted-foreground"> · {m.beneficiario}</span>}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{m.usuario}</TableCell>
            <TableCell className={`text-right font-tabular font-medium ${esEntrada(m.tipo) ? "text-ingreso" : "text-egreso"}`}>
              {esEntrada(m.tipo) ? "+" : "-"}
              {formatearMoneda(m.monto)}
            </TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatearMoneda(m.saldoNuevo)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
