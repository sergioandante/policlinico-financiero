"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { crearTransaccion, actualizarTransaccion } from "@/lib/actions/transacciones";
import { NuevaCategoriaDialog } from "@/components/transacciones/nueva-categoria-dialog";
import { PlusCircle, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

// tipo viene de Prisma como string (SQLite no soporta enums); los valores
// válidos ("INGRESO"/"EGRESO") ya se garantizan en el seed y en las acciones.
type Categoria = { id: string; nombre: string; tipo: string; parentId: string | null };
type Caja = { id: string; nombre: string };
type Area = { id: string; nombre: string };
type TransaccionExistente = {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  categoriaId: string;
  areaId: string | null;
  descripcion: string;
  metodoPago: string;
  metodoPago2: string | null;
  montoMetodoPago2: number | null;
  comprobante: string | null;
  proveedorOCliente: string | null;
  cajaId: string | null;
};

const METODOS_PAGO: { value: string; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "YAPE_PLIN", label: "Yape / Plin" },
  { value: "OTRO", label: "Otro" },
];

export function TransaccionDialog({
  categorias,
  cajas,
  areas,
  transaccion,
  autoAbrir,
}: {
  categorias: Categoria[];
  cajas: Caja[];
  areas: Area[];
  transaccion?: TransaccionExistente;
  autoAbrir?: boolean;
}) {
  const esEdicion = !!transaccion;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">((transaccion?.tipo as "INGRESO" | "EGRESO") ?? "INGRESO");
  const [monto, setMonto] = useState(transaccion?.monto?.toString() ?? "");
  const [metodoPago, setMetodoPago] = useState(transaccion?.metodoPago ?? "EFECTIVO");
  const [pagoDividido, setPagoDividido] = useState(!!transaccion?.metodoPago2);
  const [metodoPago2, setMetodoPago2] = useState(transaccion?.metodoPago2 ?? "");
  const [montoMetodoPago2, setMontoMetodoPago2] = useState(transaccion?.montoMetodoPago2?.toString() ?? "");
  const accion = esEdicion ? actualizarTransaccion.bind(null, transaccion!.id) : crearTransaccion;
  const [state, formAction, pending] = useActionState(accion, initialState);

  const montoPrincipalCalculado =
    pagoDividido && monto && montoMetodoPago2 ? Number(monto) - Number(montoMetodoPago2) : null;

  const categoriasFiltradas = useMemo(() => categorias.filter((c) => c.tipo === tipo), [categorias, tipo]);
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaInicial = transaccion ? transaccion.fecha.toISOString().slice(0, 10) : hoy;

  useEffect(() => {
    if (autoAbrir) {
      setOpen(true);
      router.replace("/transacciones");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAbrir]);

  useEffect(() => {
    if (open) {
      setTipo((transaccion?.tipo as "INGRESO" | "EGRESO") ?? "INGRESO");
      setMonto(transaccion?.monto?.toString() ?? "");
      setMetodoPago(transaccion?.metodoPago ?? "EFECTIVO");
      setPagoDividido(!!transaccion?.metodoPago2);
      setMetodoPago2(transaccion?.metodoPago2 ?? "");
      setMontoMetodoPago2(transaccion?.montoMetodoPago2?.toString() ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Transacción actualizada correctamente." : "Transacción registrada correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, esEdicion]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {esEdicion ? (
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm">
            <PlusCircle className="w-4 h-4" />
            Nueva transacción
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar transacción" : "Registrar transacción"}</DialogTitle>
          <DialogDescription>Ingreso o egreso del negocio, con categoría y caja opcional.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select name="tipo" value={tipo} onValueChange={(v) => setTipo(v as any)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO">Ingreso</SelectItem>
                  <SelectItem value="EGRESO">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input name="fecha" type="date" defaultValue={fechaInicial} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Categoría</Label>
                <NuevaCategoriaDialog tipo={tipo} inline />
              </div>
              <Select name="categoriaId" defaultValue={transaccion?.categoriaId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasFiltradas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.parentId ? "— " : ""}
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select name="areaId" defaultValue={transaccion?.areaId ?? undefined} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto (S/)</Label>
              <Input
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select name="metodoPago" value={metodoPago} onValueChange={setMetodoPago} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={pagoDividido}
                onChange={(e) => {
                  setPagoDividido(e.target.checked);
                  if (!e.target.checked) {
                    setMetodoPago2("");
                    setMontoMetodoPago2("");
                  }
                }}
                className="h-4 w-4 rounded border-input"
              />
              ¿Se pagó con dos métodos? (ej. parte Yape, parte efectivo)
            </label>

            {pagoDividido && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/40 p-3">
                <div className="space-y-1.5">
                  <Label>Segundo método</Label>
                  <Select name="metodoPago2" value={metodoPago2} onValueChange={setMetodoPago2} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGO.filter((m) => m.value !== metodoPago).map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Monto con el segundo método (S/)</Label>
                  <Input
                    name="montoMetodoPago2"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={montoMetodoPago2}
                    onChange={(e) => setMontoMetodoPago2(e.target.value)}
                  />
                </div>
                <p
                  className={`col-span-2 text-xs ${
                    montoPrincipalCalculado !== null && montoPrincipalCalculado <= 0
                      ? "text-egreso"
                      : "text-muted-foreground"
                  }`}
                >
                  {montoPrincipalCalculado !== null
                    ? `Quedan S/ ${montoPrincipalCalculado.toFixed(2)} con ${
                        METODOS_PAGO.find((m) => m.value === metodoPago)?.label ?? metodoPago
                      }.`
                    : "Ingresa el monto total y el monto del segundo método."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input
              name="descripcion"
              required
              placeholder="Ej. Pago programa premium - paciente"
              defaultValue={transaccion?.descripcion}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Proveedor / Cliente (opcional)</Label>
              <Input name="proveedorOCliente" placeholder="Nombre" defaultValue={transaccion?.proveedorOCliente ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>N° comprobante (opcional)</Label>
              <Input name="comprobante" placeholder="F001-000123" defaultValue={transaccion?.comprobante ?? undefined} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>¿Afecta una caja? (opcional)</Label>
            <Select name="cajaId" defaultValue={transaccion?.cajaId ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="No afecta caja (ej. depósito bancario directo)" />
              </SelectTrigger>
              <SelectContent>
                {cajas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar transacción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
