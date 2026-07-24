"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolverSolicitudCompra } from "@/lib/actions/compras";
import { Check, X } from "lucide-react";

export function ResolverSolicitudDialog({ solicitudId, codigo }: { solicitudId: string; codigo: string }) {
  const [open, setOpen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [pending, startTransition] = useTransition();

  function resolver(estado: "APROBADA" | "RECHAZADA") {
    startTransition(async () => {
      const res = await resolverSolicitudCompra(solicitudId, estado, comentario);
      if (res.ok) {
        toast.success(estado === "APROBADA" ? "Solicitud aprobada." : "Solicitud rechazada.");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Error al resolver la solicitud");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Resolver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver solicitud {codigo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="Comentario (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={() => resolver("RECHAZADA")} disabled={pending}>
            <X className="w-4 h-4" /> Rechazar
          </Button>
          <Button onClick={() => resolver("APROBADA")} disabled={pending}>
            <Check className="w-4 h-4" /> Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
