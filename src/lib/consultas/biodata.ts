import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// Todas las consultas filtran SIEMPRE por usuarioId: el doctor solo puede
// ver su propia evolución, nunca la de otro doctor.
export async function obtenerMetricasSalud(usuarioId: string) {
  const metricas = await prisma.metricaSalud.findMany({
    where: { usuarioId },
    orderBy: { fecha: "asc" },
  });

  return metricas.map((m) => ({
    id: m.id,
    fecha: m.fecha,
    fechaCorta: format(m.fecha, "dd/MM"),
    fechaISO: format(m.fecha, "yyyy-MM-dd"),
    pesoKg: Number(m.pesoKg),
    alturaCm: Number(m.alturaCm),
    imc: Number(m.imc),
    presionSistolica: m.presionSistolica,
    presionDiastolica: m.presionDiastolica,
    notas: m.notas,
  }));
}

export async function obtenerUltimaMetrica(usuarioId: string) {
  const ultima = await prisma.metricaSalud.findFirst({
    where: { usuarioId },
    orderBy: { fecha: "desc" },
  });
  if (!ultima) return null;
  return {
    fecha: ultima.fecha,
    pesoKg: Number(ultima.pesoKg),
    alturaCm: Number(ultima.alturaCm),
    imc: Number(ultima.imc),
    presionSistolica: ultima.presionSistolica,
    presionDiastolica: ultima.presionDiastolica,
  };
}
