"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarMovimientoCaja } from "@/lib/actions/cajas";
import { Trash2 } from "lucide-react";

export function EliminarMovimientoButton({ movimientoId, esTraspaso }: { movimientoId: string; esTraspaso: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const mensaje = esTraspaso
      ? "¿Eliminar este traspaso? Se eliminarán ambos movimientos (salida y entrada). Esto no se puede deshacer."
      : "¿Eliminar este movimiento? Esto no se puede deshacer.";
    if (!confirm(mensaje)) return;
    startTransition(async () => {
      const res = await eliminarMovimientoCaja(movimientoId);
      if (res.ok) {
        toast.success("Movimiento eliminado.");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-egreso hover:text-egreso" onClick={handleClick} disabled={pending}>
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  );
}
