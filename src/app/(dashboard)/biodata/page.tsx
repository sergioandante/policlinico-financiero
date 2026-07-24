import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerMetricasSalud, obtenerUltimaMetrica } from "@/lib/consultas/biodata";
import { PesoChart } from "@/components/biodata/peso-chart";
import { MetricaForm } from "@/components/biodata/metrica-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatearFecha } from "@/lib/utils";
import { Weight, Activity, HeartPulse } from "lucide-react";

export default async function BiodataPage() {
  const session = await auth();

  // Protección de acceso: solo el rol DOCTOR ve este módulo, y siempre sobre
  // su propio usuarioId (nunca se acepta un id externo vía query/formulario).
  if (!session?.user || !puede(session.user.rol, "verBiodata")) redirect("/dashboard");

  const usuarioId = session.user.id;
  const [metricas, ultima] = await Promise.all([
    obtenerMetricasSalud(usuarioId),
    obtenerUltimaMetrica(usuarioId),
  ]);

  const historialReciente = [...metricas].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Mi Biodata</h1>
        <p className="text-sm text-muted-foreground">
          Registro privado de tus métricas de salud. Solo tú puedes ver esta información.
        </p>
      </div>

      {ultima && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Último peso</p>
                <p className="font-display text-2xl font-bold font-tabular">{ultima.pesoKg.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">{formatearFecha(ultima.fecha)}</p>
              </div>
              <div className="rounded-full p-2.5 text-brand-700 bg-brand-100">
                <Weight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">IMC actual</p>
                <p className="font-display text-2xl font-bold font-tabular">{ultima.imc.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{formatearFecha(ultima.fecha)}</p>
              </div>
              <div className="rounded-full p-2.5 text-brand-700 bg-brand-100">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Presión arterial</p>
                <p className="font-display text-2xl font-bold font-tabular">
                  {ultima.presionSistolica}/{ultima.presionDiastolica}
                </p>
                <p className="text-xs text-muted-foreground">{formatearFecha(ultima.fecha)}</p>
              </div>
              <div className="rounded-full p-2.5 text-brand-700 bg-brand-100">
                <HeartPulse className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de peso</CardTitle>
            <CardDescription>Todos tus registros, ordenados cronológicamente</CardDescription>
          </CardHeader>
          <CardContent>
            <PesoChart data={metricas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar métrica diaria</CardTitle>
            <CardDescription>Peso, altura y presión arterial</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricaForm alturaSugerida={ultima?.alturaCm} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
          <CardDescription>Últimos 10 registros</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>IMC</TableHead>
                <TableHead>Presión</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historialReciente.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    Aún no tienes registros.
                  </TableCell>
                </TableRow>
              )}
              {historialReciente.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatearFecha(m.fecha)}</TableCell>
                  <TableCell className="font-tabular">{m.pesoKg.toFixed(1)} kg</TableCell>
                  <TableCell className="font-tabular">{m.imc.toFixed(1)}</TableCell>
                  <TableCell className="font-tabular">
                    {m.presionSistolica}/{m.presionDiastolica}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.notas ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
