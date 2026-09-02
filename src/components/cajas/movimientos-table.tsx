import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFechaHora } from "@/lib/utils";
import { EditarMovimientoDialog } from "@/components/cajas/editar-movimiento-dialog";
import { EliminarMovimientoButton } from "@/components/cajas/eliminar-movimiento-button";

const ETIQUETAS: Record<string, { texto: string; variant: any }> = {
  INGRESO: { texto: "Ingreso", variant: "success" },
  EGRESO: { texto: "Egreso", variant: "destructive" },
  TRASPASO_SALIDA: { texto: "Traspaso (salida)", variant: "warning" },
  TRASPASO_ENTRADA: { texto: "Traspaso (entrada)", variant: "warning" },
  RETIRO: { texto: "Retiro", variant: "destructive" },
  ADELANTO_SUELDO: { texto: "Adelanto sueldo", variant: "destructive" },
};
const TIPOS_TRASPASO = new Set(["TRASPASO_SALIDA", "TRASPASO_ENTRADA"]);
const TIPOS_CON_BENEFICIARIO = new Set(["RETIRO", "ADELANTO_SUELDO"]);

type Movimiento = {
  id: string;
  caja: string;
  cajaDestino: string | null;
  tipo: string;
  monto: number;
  descripcion: string;
  beneficiario: string | null;
  transaccionId: string | null;
  usuario: string;
  fecha: Date;
  saldoNuevo: number;
};

export function MovimientosTable({ movimientos, puedeEditar }: { movimientos: Movimiento[]; puedeEditar: boolean }) {
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
          {puedeEditar && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No hay movimientos para los filtros seleccionados.
            </TableCell>
          </TableRow>
        )}
        {movimientos.map((m) => {
          const esTraspaso = TIPOS_TRASPASO.has(m.tipo);
          const vieneDeTransaccion = !!m.transaccionId;
          return (
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
              {puedeEditar && (
                <TableCell>
                  {vieneDeTransaccion ? (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Editar en Transacciones</span>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      {!esTraspaso && (
                        <EditarMovimientoDialog
                          movimiento={{
                            id: m.id,
                            monto: m.monto,
                            descripcion: m.descripcion,
                            beneficiario: m.beneficiario,
                            fecha: m.fecha,
                            esSalidaConBeneficiario: TIPOS_CON_BENEFICIARIO.has(m.tipo),
                          }}
                        />
                      )}
                      <EliminarMovimientoButton movimientoId={m.id} esTraspaso={esTraspaso} />
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
