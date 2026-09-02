import { Card, CardContent } from "@/components/ui/card";
import { formatearMoneda } from "@/lib/utils";
import { Wallet2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditarCajaDialog } from "@/components/cajas/editar-caja-dialog";

export function CajaBalanceCard({
  id,
  nombre,
  tipo,
  saldo,
  puedeEditar,
}: {
  id?: string;
  nombre: string;
  tipo: string; // viene de Prisma como String (SQLite/Postgres sin enum nativo aquí)
  saldo: number;
  puedeEditar?: boolean;
}) {
  const esGrande = tipo === "GRANDE";
  return (
    <Card className={cn("relative overflow-hidden", esGrande && "border-brand-300")}>
      <div className={cn("absolute top-0 left-0 h-1 w-full", esGrande ? "bg-brand-600" : "bg-brand-300")} />
      <CardContent className="pt-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{nombre}</p>
            {puedeEditar && id && <EditarCajaDialog cajaId={id} nombre={nombre} />}
          </div>
          <p className="font-display text-3xl font-bold font-tabular text-ink">{formatearMoneda(saldo)}</p>
        </div>
        <div className={cn("rounded-full p-3", esGrande ? "bg-brand-100 text-brand-700" : "bg-brand-50 text-brand-500")}>
          {esGrande ? <Landmark className="w-6 h-6" /> : <Wallet2 className="w-6 h-6" />}
        </div>
      </CardContent>
    </Card>
  );
}
