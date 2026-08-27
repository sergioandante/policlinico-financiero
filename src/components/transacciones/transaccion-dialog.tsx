"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
  comprobante: string | null;
  proveedorOCliente: string | null;
  cajaId: string | null;
};

export function TransaccionDialog({
  categorias,
  cajas,
  areas,
  transaccion,
}: {
  categorias: Categoria[];
  cajas: Caja[];
  areas: Area[];
  transaccion?: TransaccionExistente;
}) {
  const esEdicion = !!transaccion;
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">((transaccion?.tipo as "INGRESO" | "EGRESO") ?? "INGRESO");
  const accion = esEdicion ? actualizarTransaccion.bind(null, transaccion!.id) : crearTransaccion;
  const [state, formAction, pending] = useActionState(accion, initialState);

  const categoriasFiltradas = useMemo(() => categorias.filter((c) => c.tipo === tipo), [categorias, tipo]);
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaInicial = transaccion ? transaccion.fecha.toISOString().slice(0, 10) : hoy;

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
                <NuevaCategoriaDialog tipo={tipo} />
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
                defaultValue={transaccion?.monto}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select name="metodoPago" defaultValue={transaccion?.metodoPago ?? "EFECTIVO"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="TARJETA">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="YAPE_PLIN">Yape / Plin</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
