import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda, formatearFecha } from "@/lib/utils";
import { ResolverSolicitudDialog } from "@/components/compras/resolver-solicitud-dialog";

const ESTADO_BADGE: Record<string, any> = {
  PENDIENTE: "warning",
  APROBADA: "success",
  RECHAZADA: "destructive",
  COMPLETADA: "secondary",
};

type Solicitud = {
  id: string;
  codigo: string;
  area: string;
  justificacion: string;
  montoEstimado: number;
  estado: string;
  solicitante: string;
  fechaSolicitud: Date;
  items: { id: string; descripcion: string; cantidad: number; precioEstimado: number }[];
};

export function SolicitudesTable({ solicitudes, puedeAprobar }: { solicitudes: Solicitud[]; puedeAprobar: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead>Detalle</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Monto est.</TableHead>
          <TableHead>Estado</TableHead>
          {puedeAprobar && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitudes.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No hay solicitudes registradas.
            </TableCell>
          </TableRow>
        )}
        {solicitudes.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="text-sm font-mono">{s.codigo}</TableCell>
            <TableCell className="text-sm">{s.area}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{s.solicitante}</TableCell>
            <TableCell className="text-sm max-w-[220px]">
              <p className="truncate" title={s.justificacion}>
                {s.justificacion}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.items.map((i) => `${i.cantidad}x ${i.descripcion}`).join(", ")}
              </p>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {formatearFecha(s.fechaSolicitud)}
            </TableCell>
            <TableCell className="text-right font-tabular">{formatearMoneda(s.montoEstimado)}</TableCell>
            <TableCell>
              <Badge variant={ESTADO_BADGE[s.estado]}>{s.estado}</Badge>
            </TableCell>
            {puedeAprobar && (
              <TableCell>{s.estado === "PENDIENTE" && <ResolverSolicitudDialog solicitudId={s.id} codigo={s.codigo} />}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
