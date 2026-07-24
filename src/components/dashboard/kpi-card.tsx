import { cn, formatearMoneda } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  titulo,
  valor,
  icon: Icon,
  tono = "neutral",
  subtitulo,
}: {
  titulo: string;
  valor: number;
  icon: LucideIcon;
  tono?: "ingreso" | "egreso" | "neutral";
  subtitulo?: string;
}) {
  const colorTono =
    tono === "ingreso" ? "text-ingreso bg-ingreso-bg" : tono === "egreso" ? "text-egreso bg-egreso-bg" : "text-brand-700 bg-brand-100";

  return (
    <Card>
      <CardContent className="pt-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="font-display text-2xl font-bold font-tabular">{formatearMoneda(valor)}</p>
          {subtitulo && (
            <p className={cn("text-xs flex items-center gap-1", tono === "egreso" ? "text-egreso" : "text-ingreso")}>
              {tono === "egreso" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {subtitulo}
            </p>
          )}
        </div>
        <div className={cn("rounded-full p-2.5", colorTono)}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}
