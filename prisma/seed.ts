import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Las 14 áreas del Policlínico San Damián.
const AREAS = [
  { nombre: "Traumatología", tipo: "CLINICA" },
  { nombre: "Cardiología", tipo: "CLINICA" },
  { nombre: "Pediatría", tipo: "CLINICA" },
  { nombre: "Baja de Peso", tipo: "CLINICA" },
  { nombre: "Odontología", tipo: "CLINICA" },
  { nombre: "Laboratorio", tipo: "CLINICA" },
  { nombre: "Medicina General", tipo: "CLINICA" },
  { nombre: "Ginecología", tipo: "CLINICA" },
  { nombre: "Medicina Estética", tipo: "CLINICA" },
  { nombre: "Ventas/Comercial", tipo: "ADMINISTRATIVA" },
  { nombre: "RRHH", tipo: "ADMINISTRATIVA" },
  { nombre: "Logística", tipo: "ADMINISTRATIVA" },
  { nombre: "Recepción", tipo: "ADMINISTRATIVA" },
  { nombre: "Administrativa", tipo: "ADMINISTRATIVA" },
  { nombre: "Limpieza", tipo: "ADMINISTRATIVA" },
];

const AREAS_CLINICAS = AREAS.filter((a) => a.tipo === "CLINICA").map((a) => a.nombre);

async function main() {
  console.log("Sembrando base de datos...");

  // ---------- USUARIOS ----------
  const passwordHash = await bcrypt.hash("policlinico2026", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@policlinico.pe" },
    update: {},
    create: {
      nombre: "Rosa Medina (Administradora)",
      email: "admin@policlinico.pe",
      passwordHash,
      rol: "ADMINISTRADOR",
    },
  });

  const gerente = await prisma.usuario.upsert({
    where: { email: "gerencia@policlinico.pe" },
    update: {},
    create: {
      nombre: "Jorge Salas (Gerente)",
      email: "gerencia@policlinico.pe",
      passwordHash,
      rol: "GERENTE",
    },
  });

  const logistica = await prisma.usuario.upsert({
    where: { email: "logistica@policlinico.pe" },
    update: {},
    create: {
      nombre: "Mariana Quispe (Logística)",
      email: "logistica@policlinico.pe",
      passwordHash,
      rol: "LOGISTICA",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "contabilidad@policlinico.pe" },
    update: {},
    create: {
      nombre: "Luis Fernández (Contador)",
      email: "contabilidad@policlinico.pe",
      passwordHash,
      rol: "CONTADOR",
    },
  });

  // ---------- ÁREAS ----------
  const areasCreadas = new Map<string, string>();
  for (const a of AREAS) {
    const area = await prisma.area.upsert({
      where: { nombre: a.nombre },
      update: {},
      create: a,
    });
    areasCreadas.set(a.nombre, area.id);
  }
  const areaLaboratorio = areasCreadas.get("Laboratorio")!;
  const areaBajaDePeso = areasCreadas.get("Baja de Peso")!;
  const areaMedicinaGeneral = areasCreadas.get("Medicina General")!;
  const areaVentas = areasCreadas.get("Ventas/Comercial")!;

  // ---------- CATEGORÍAS ----------
  const catVentas = await prisma.categoria.create({
    data: { nombre: "Ventas de programas y consultas", tipo: "INGRESO" },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Programa Pérdida de Peso - Básico", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Programa Pérdida de Peso - Premium", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Consultas nutricionales", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Consulta médica general", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Consulta especializada", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Exámenes de laboratorio", tipo: "INGRESO", parentId: catVentas.id },
    ],
  });
  const catOtrosIngresos = await prisma.categoria.create({
    data: { nombre: "Otros ingresos", tipo: "INGRESO" },
  });

  const catSalarios = await prisma.categoria.create({
    data: { nombre: "Salarios", tipo: "EGRESO", esFijo: true },
  });
  const catAlquiler = await prisma.categoria.create({
    data: { nombre: "Alquiler de local", tipo: "EGRESO", esFijo: true },
  });
  const catServicios = await prisma.categoria.create({
    data: { nombre: "Servicios (luz, agua, internet)", tipo: "EGRESO", esFijo: true },
  });
  const catProveedores = await prisma.categoria.create({
    data: { nombre: "Proveedores", tipo: "EGRESO", esFijo: false },
  });
  const catMarketing = await prisma.categoria.create({
    data: { nombre: "Marketing", tipo: "EGRESO", esFijo: false },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Publicidad redes sociales", tipo: "EGRESO", esFijo: false, parentId: catMarketing.id },
      { nombre: "Influencers / colaboraciones", tipo: "EGRESO", esFijo: false, parentId: catMarketing.id },
      { nombre: "Material gráfico / impresiones", tipo: "EGRESO", esFijo: false, parentId: catMarketing.id },
    ],
  });
  const catInventarioCompras = await prisma.categoria.create({
    data: { nombre: "Compras de inventario", tipo: "EGRESO", esFijo: false },
  });
  const catRemodelacion = await prisma.categoria.create({
    data: { nombre: "Remodelaciones", tipo: "EGRESO", esFijo: false },
  });

  // ---------- CAJAS ----------
  const cajaChica = await prisma.caja.upsert({
    where: { tipo: "CHICA" },
    update: {},
    create: { nombre: "Caja Chica (Operativa)", tipo: "CHICA", saldoActual: 1500 },
  });
  const cajaGrande = await prisma.caja.upsert({
    where: { tipo: "GRANDE" },
    update: {},
    create: { nombre: "Caja Grande (Principal)", tipo: "GRANDE", saldoActual: 42000 },
  });

  await prisma.movimientoCaja.createMany({
    data: [
      {
        cajaId: cajaChica.id,
        tipo: "INGRESO",
        monto: 1500,
        saldoAnterior: 0,
        saldoNuevo: 1500,
        descripcion: "Apertura de caja chica",
        usuarioId: admin.id,
      },
      {
        cajaId: cajaGrande.id,
        tipo: "INGRESO",
        monto: 42000,
        saldoAnterior: 0,
        saldoNuevo: 42000,
        descripcion: "Saldo inicial migrado desde Excel",
        usuarioId: admin.id,
      },
    ],
  });

  // ---------- PRESUPUESTOS DEL MES (por área) ----------
  const hoy = new Date();
  await prisma.presupuesto.createMany({
    data: [
      {
        areaId: areaVentas,
        nombre: `Ventas/Comercial - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        montoAsignado: 8250,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        umbralAlerta: 80,
      },
      {
        areaId: areaBajaDePeso,
        nombre: `Baja de Peso - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        montoAsignado: 6000,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        umbralAlerta: 85,
      },
      {
        areaId: areaLaboratorio,
        nombre: `Laboratorio - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        montoAsignado: 4500,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        umbralAlerta: 80,
      },
      {
        areaId: areasCreadas.get("Administrativa")!,
        nombre: `Administrativa - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        montoAsignado: 18000,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        umbralAlerta: 90,
      },
    ],
  });

  // ---------- METAS ECONÓMICAS ----------
  await prisma.metaFinanciera.createMany({
    data: [
      {
        nombre: `Meta de ingresos - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        tipo: "INGRESO_MENSUAL",
        montoObjetivo: 60000,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        notas: "Meta consolidada de todo el policlínico.",
      },
      {
        nombre: `Reducir gasto en Proveedores - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        tipo: "REDUCCION_GASTO",
        montoObjetivo: 5000,
        areaId: areaLaboratorio,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        notas: "Renegociar contrato con proveedor de reactivos.",
      },
      {
        nombre: `Ahorro operativo - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
        tipo: "AHORRO",
        montoObjetivo: 10000,
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
      },
    ],
  });

  // ---------- INVENTARIO ----------
  await prisma.inventarioItem.createMany({
    data: [
      { codigo: "INV-0001", nombre: "Vacuna refuerzo metabólico", categoria: "Vacunas", unidadMedida: "dosis", stockActual: 8, stockMinimo: 10, fechaVencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15) },
      { codigo: "INV-0002", nombre: "Suplemento quemador L-Carnitina", categoria: "Suplementos", unidadMedida: "frasco", stockActual: 22, stockMinimo: 15 },
      { codigo: "INV-0003", nombre: "Jeringas descartables 3ml", categoria: "Insumos médicos", unidadMedida: "caja", stockActual: 4, stockMinimo: 5 },
      { codigo: "INV-0004", nombre: "Alcohol antiséptico", categoria: "Insumos médicos", unidadMedida: "litro", stockActual: 12, stockMinimo: 6 },
      { codigo: "INV-0005", nombre: "Tubos de ensayo al vacío", categoria: "Insumos de laboratorio", unidadMedida: "caja", stockActual: 6, stockMinimo: 10 },
      { codigo: "INV-0006", nombre: "Guantes de nitrilo talla M", categoria: "Insumos médicos", unidadMedida: "caja", stockActual: 18, stockMinimo: 8 },
    ],
  });

  // ---------- TRANSACCIONES DE EJEMPLO (últimos ~2 meses, ligadas a área) ----------
  const catsIngreso = await prisma.categoria.findMany({ where: { tipo: "INGRESO", parentId: { not: null } } });
  const catsEgreso = [catSalarios, catProveedores, catServicios, catMarketing, catInventarioCompras, catAlquiler];
  const areaIds = Array.from(areasCreadas.values());

  const transacciones = [];
  for (let i = 0; i < 90; i++) {
    const dias = Math.floor(Math.random() * 60);
    const fecha = new Date(hoy.getTime() - dias * 24 * 3600 * 1000);
    const esIngreso = Math.random() > 0.35;
    if (esIngreso) {
      const cat = catsIngreso[Math.floor(Math.random() * catsIngreso.length)];
      const areaNombre = AREAS_CLINICAS[Math.floor(Math.random() * AREAS_CLINICAS.length)];
      transacciones.push({
        tipo: "INGRESO" as const,
        monto: Math.round((300 + Math.random() * 1200) * 100) / 100,
        fecha,
        categoriaId: cat.id,
        areaId: areasCreadas.get(areaNombre)!,
        descripcion: "Pago de paciente - " + cat.nombre,
        metodoPago: ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE_PLIN"][Math.floor(Math.random() * 4)] as any,
        usuarioId: admin.id,
      });
    } else {
      const cat = catsEgreso[Math.floor(Math.random() * catsEgreso.length)];
      const areaId = areaIds[Math.floor(Math.random() * areaIds.length)];
      transacciones.push({
        tipo: "EGRESO" as const,
        monto: Math.round((80 + Math.random() * 900) * 100) / 100,
        fecha,
        categoriaId: cat.id,
        areaId,
        descripcion: "Gasto - " + cat.nombre,
        metodoPago: "TRANSFERENCIA" as const,
        usuarioId: gerente.id,
      });
    }
  }
  for (const t of transacciones) {
    await prisma.transaccion.create({ data: t });
  }

  // ---------- SOLICITUDES DE COMPRA ----------
  const total = await prisma.solicitudCompra.count();
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0001",
      areaId: areaLaboratorio,
      justificacion: "Reposición de tubos de ensayo al vacío, stock por debajo del mínimo.",
      montoEstimado: 450,
      estado: "PENDIENTE",
      solicitanteId: logistica.id,
      items: {
        create: [{ descripcion: "Tubos de ensayo al vacío (caja x100)", cantidad: 5, precioEstimado: 90 }],
      },
    },
  });
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0002",
      areaId: areaVentas,
      justificacion: "Impresión de material gráfico para campaña de verano.",
      montoEstimado: 620,
      estado: "APROBADA",
      solicitanteId: gerente.id,
      aprobadorId: admin.id,
      fechaResolucion: new Date(),
      comentarioResolucion: "Aprobado dentro de presupuesto de Ventas/Comercial.",
      items: {
        create: [{ descripcion: "Banners y volantes", cantidad: 1, precioEstimado: 620 }],
      },
    },
  });

  console.log("Seed completado.");
  console.log("Usuarios de prueba (password para todos: policlinico2026):");
  console.log("  admin@policlinico.pe          -> Administrador");
  console.log("  gerencia@policlinico.pe       -> Gerente");
  console.log("  logistica@policlinico.pe      -> Logística");
  console.log("  contabilidad@policlinico.pe   -> Contador (solo lectura)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
