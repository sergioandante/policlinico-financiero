import { prisma } from "@/lib/prisma";

export async function obtenerCajas() {
  const cajas = await prisma.caja.findMany({ orderBy: { tipo: "asc" } });
  return cajas.map((c) => ({ ...c, saldoActual: Number(c.saldoActual) }));
}

export async function obtenerMovimientos(filtros: {
  cajaId?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
}) {
  const where: any = {};
  if (filtros.cajaId) where.cajaId = filtros.cajaId;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fecha.lte = new Date(filtros.hasta + "T23:59:59");
  }

  const movimientos = await prisma.movimientoCaja.findMany({
    where,
    include: { caja: true, cajaDestino: true, usuario: true },
    orderBy: { fecha: "desc" },
    take: 200,
  });

  return movimientos.map((m) => ({
    id: m.id,
    cajaId: m.cajaId,
    caja: m.caja.nombre,
    cajaDestino: m.cajaDestino?.nombre ?? null,
    tipo: m.tipo,
    monto: Number(m.monto),
    saldoAnterior: Number(m.saldoAnterior),
    saldoNuevo: Number(m.saldoNuevo),
    descripcion: m.descripcion,
    beneficiario: m.beneficiario,
    transaccionId: m.transaccionId,
    usuario: m.usuario.nombre,
    fecha: m.fecha,
  }));
}
