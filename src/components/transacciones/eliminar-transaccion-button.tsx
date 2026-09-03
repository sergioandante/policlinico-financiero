"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarTransaccion } from "@/lib/actions/transacciones";
import { Trash2 } from "lucide-react";

export function EliminarTransaccionButton({ transaccionId }: { transaccionId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta transacción? Si afecta una caja, también se eliminará su movimiento y se recalculará el saldo. Esto no se puede deshacer.")) return;
    startTransition(async () => {
      const res = await eliminarTransaccion(transaccionId);
      if (res.ok) {
        toast.success("Transacción eliminada.");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Button size="icon" variant="ghost" className="h-8 w-8 text-egreso hover:text-egreso" onClick={handleClick} disabled={pending}>
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
