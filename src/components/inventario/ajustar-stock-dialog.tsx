"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ajustarStock } from "@/lib/actions/inventario";
import { PackagePlus } from "lucide-react";

export function AjustarStockDialog({ itemId, nombre }: { itemId: string; nombre: string }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await ajustarStock(itemId, tipo, Number(cantidad), motivo);
      if (res.ok) {
        toast.success("Stock actualizado.");
        setOpen(false);
        setCantidad("");
        setMotivo("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Ajustar stock">
          <PackagePlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar stock — {nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada (compra / reposición)</SelectItem>
                <SelectItem value="SALIDA">Salida (uso / consumo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad</Label>
            <Input type="number" min="1" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Input required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Compra a proveedor X" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
