import { prisma } from "@/lib/prisma";

export async function obtenerSolicitudesCompra(filtros: { estado?: string; areaId?: string }) {
  const where: any = {};
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.areaId) where.areaId = filtros.areaId;

  const solicitudes = await prisma.solicitudCompra.findMany({
    where,
    include: { solicitante: true, aprobador: true, items: true, area: true },
    orderBy: { fechaSolicitud: "desc" },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    codigo: s.codigo,
    areaId: s.areaId,
    area: s.area.nombre,
    justificacion: s.justificacion,
    montoEstimado: Number(s.montoEstimado),
    estado: s.estado,
    solicitanteId: s.solicitanteId,
    solicitante: s.solicitante.nombre,
    aprobador: s.aprobador?.nombre ?? null,
    comentarioResolucion: s.comentarioResolucion,
    fechaSolicitud: s.fechaSolicitud,
    fechaResolucion: s.fechaResolucion,
    items: s.items.map((i) => ({
      id: i.id,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioEstimado: Number(i.precioEstimado),
    })),
  }));
}
