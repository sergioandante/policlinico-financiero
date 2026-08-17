import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { clasificarTransaccion } from "../src/lib/clasificacion-areas";

const prisma = new PrismaClient();

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

  await prisma.usuario.upsert({
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

  const doctor = await prisma.usuario.upsert({
    where: { email: "doctor@policlinico.pe" },
    update: {},
    create: {
      nombre: "Dr. Andrés Vidal",
      email: "doctor@policlinico.pe",
      passwordHash,
      rol: "DOCTOR",
    },
  });

  // ---------- CATEGORÍAS ----------
  const catVentas = await prisma.categoria.create({
    data: { nombre: "Ventas de programas", tipo: "INGRESO" },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Programa Pérdida de Peso - Básico", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Programa Pérdida de Peso - Premium", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Consultas nutricionales", tipo: "INGRESO", parentId: catVentas.id },
    ],
  });
  const catOtrosIngresos = await prisma.categoria.create({
    data: { nombre: "Otros ingresos", tipo: "INGRESO" },
  });

  // Categorías por área/especialidad (ver src/lib/clasificacion-areas.ts) —
  // usadas para las transacciones de ejemplo clasificadas automáticamente.
  const catBP = await prisma.categoria.create({ data: { nombre: "BP", tipo: "INGRESO" } });
  const catChequeoGeneral = await prisma.categoria.create({
    data: { nombre: "Chequeo General Completo (C HG)", tipo: "INGRESO" },
  });
  const catTraumatologia = await prisma.categoria.create({
    data: { nombre: "Traumatología (TR)", tipo: "INGRESO" },
  });
  const catOdontologia = await prisma.categoria.create({ data: { nombre: "Odontología", tipo: "INGRESO" } });

  const catSalarios = await prisma.categoria.create({
    data: { nombre: "Salarios", tipo: "EGRESO" },
  });
  const catProveedores = await prisma.categoria.create({
    data: { nombre: "Proveedores", tipo: "EGRESO" },
  });
  const catServicios = await prisma.categoria.create({
    data: { nombre: "Servicios (luz, agua, internet)", tipo: "EGRESO" },
  });
  const catMarketing = await prisma.categoria.create({
    data: { nombre: "Marketing", tipo: "EGRESO" },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Publicidad redes sociales", tipo: "EGRESO", parentId: catMarketing.id },
      { nombre: "Influencers / colaboraciones", tipo: "EGRESO", parentId: catMarketing.id },
      { nombre: "Material gráfico / impresiones", tipo: "EGRESO", parentId: catMarketing.id },
    ],
  });
  const catInventarioCompras = await prisma.categoria.create({
    data: { nombre: "Compras de inventario", tipo: "EGRESO" },
  });
  const catRemodelacion = await prisma.categoria.create({
    data: { nombre: "Remodelaciones", tipo: "EGRESO" },
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

  // Movimiento inicial de apertura para que el historial no arranque vacío
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

  // ---------- PRESUPUESTO DE MARKETING (el caso puntual del cliente) ----------
  const hoy = new Date();
  await prisma.presupuesto.create({
    data: {
      categoriaId: catMarketing.id,
      nombre: `Marketing - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
      montoAsignado: 8250,
      periodoMes: hoy.getMonth() + 1,
      periodoAnio: hoy.getFullYear(),
      umbralAlerta: 80,
    },
  });
  await prisma.presupuesto.create({
    data: {
      categoriaId: catSalarios.id,
      nombre: `Salarios - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
      montoAsignado: 18000,
      periodoMes: hoy.getMonth() + 1,
      periodoAnio: hoy.getFullYear(),
      umbralAlerta: 90,
    },
  });

  // ---------- INVENTARIO ----------
  await prisma.inventarioItem.createMany({
    data: [
      { nombre: "Vacuna refuerzo metabólico", categoria: "Vacunas", unidadMedida: "dosis", stockActual: 8, stockMinimo: 10, fechaVencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15) },
      { nombre: "Suplemento quemador L-Carnitina", categoria: "Suplementos", unidadMedida: "frasco", stockActual: 22, stockMinimo: 15 },
      { nombre: "Jeringas descartables 3ml", categoria: "Insumos médicos", unidadMedida: "caja", stockActual: 4, stockMinimo: 5 },
      { nombre: "Alcohol antiséptico", categoria: "Insumos médicos", unidadMedida: "litro", stockActual: 12, stockMinimo: 6 },
    ],
  });

  // ---------- TRANSACCIONES DE EJEMPLO ----------
  // Dos bloques, siguiendo lo pedido: (1) histórico mes a mes SIN desglose
  // por área, solo para graficar la tendencia general con sus picos; (2) el
  // mes en curso CON desglose por área, usando descripciones que incluyen
  // los códigos (BP, C HG, TR, Odontología) para que la clasificación
  // automática los agrupe igual que lo hará con los datos reales importados
  // desde Excel. Los montos son ilustrativos, no datos reales del cliente.
  const catsIngresoGenerico = await prisma.categoria.findMany({ where: { tipo: "INGRESO", parentId: { not: null } } });
  const catsEgreso = [catSalarios, catProveedores, catServicios, catMarketing, catInventarioCompras];
  const metodosPago = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE_PLIN"] as const;

  const transacciones: {
    tipo: "INGRESO" | "EGRESO";
    monto: number;
    fecha: Date;
    categoriaId: string;
    descripcion: string;
    metodoPago: (typeof metodosPago)[number];
    usuarioId: string;
    area?: string | null;
    subclaseBP?: string | null;
    posiblePagoMultiple?: boolean;
  }[] = [];

  // --- (1) Histórico ene-jul (sin desglose por área), con picos como en el
  // ejemplo del cliente (repunte de abril, 111k mayo vs 134k junio) ---
  const facturacionMensualObjetivo: { mesIndex: number; anio: number; total: number }[] = [
    { mesIndex: 0, anio: 2026, total: 78000 }, // enero
    { mesIndex: 1, anio: 2026, total: 82000 }, // febrero
    { mesIndex: 2, anio: 2026, total: 96000 }, // marzo
    { mesIndex: 3, anio: 2026, total: 121000 }, // abril (repunte)
    { mesIndex: 4, anio: 2026, total: 111000 }, // mayo
    { mesIndex: 5, anio: 2026, total: 134000 }, // junio (pico)
    { mesIndex: 6, anio: 2026, total: 105000 }, // julio
  ];
  for (const { mesIndex, anio, total } of facturacionMensualObjetivo) {
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();
    const numTransacciones = 22;
    // Pesos aleatorios que luego se escalan para sumar exactamente el total objetivo.
    const pesos = Array.from({ length: numTransacciones }, () => 0.5 + Math.random());
    const sumaPesos = pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < numTransacciones; i++) {
      const cat = catsIngresoGenerico[Math.floor(Math.random() * catsIngresoGenerico.length)];
      const dia = 1 + Math.floor(Math.random() * diasEnMes);
      transacciones.push({
        tipo: "INGRESO",
        monto: Math.round((total * (pesos[i] / sumaPesos)) * 100) / 100,
        fecha: new Date(anio, mesIndex, dia),
        categoriaId: cat.id,
        descripcion: "Pago de paciente - " + cat.nombre,
        metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        usuarioId: admin.id,
        area: null,
        subclaseBP: null,
      });
    }
  }

  // --- (2) Mes en curso, con clasificación automática por área ---
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const diaMaxActual = hoy.getDate();

  function fechaAleatoriaDelMes() {
    const dia = 1 + Math.floor(Math.random() * diaMaxActual);
    return new Date(anioActual, mesActual, dia);
  }

  function agregarIngresoClasificado(descripcion: string, monto: number, categoriaId: string) {
    const clasificacion = clasificarTransaccion(descripcion, monto);
    transacciones.push({
      tipo: "INGRESO",
      monto,
      fecha: fechaAleatoriaDelMes(),
      categoriaId,
      descripcion,
      metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
      usuarioId: admin.id,
      area: clasificacion.area,
      subclaseBP: clasificacion.subclaseBP,
      posiblePagoMultiple: clasificacion.posiblePagoMultiple,
    });
  }

  // BP — consultas individuales (<= 350)
  for (let i = 0; i < 14; i++) {
    agregarIngresoClasificado(
      `Consulta BP - paciente ${i + 1}`,
      [75, 100, 150, 220, 280, 350][Math.floor(Math.random() * 6)],
      catBP.id
    );
  }
  // BP — pagos combinados (2 consultas en 1 solo cobro, dispara "posible pago múltiple")
  agregarIngresoClasificado("Consulta BP - pago combinado 2 pacientes", 150, catBP.id);
  agregarIngresoClasificado("Consulta BP - pago combinado 2 pacientes", 150, catBP.id);
  // BP — compra de paquetes (>= 600)
  for (let i = 0; i < 10; i++) {
    agregarIngresoClasificado(
      `Compra paquete BP - paciente ${i + 1}`,
      [600, 750, 850, 950, 1100][Math.floor(Math.random() * 5)],
      catBP.id
    );
  }
  // BP — zona gris (350-600), queda marcada para revisar manualmente
  agregarIngresoClasificado("Pago BP - combo mixto paciente", 480, catBP.id);
  agregarIngresoClasificado("Pago BP - combo mixto paciente", 420, catBP.id);

  // C HG — Chequeo General Completo
  for (let i = 0; i < 9; i++) {
    agregarIngresoClasificado(
      `C HG - Chequeo General Completo, paciente ${i + 1}`,
      [180, 220, 250, 300][Math.floor(Math.random() * 4)],
      catChequeoGeneral.id
    );
  }

  // TR — Traumatología
  for (let i = 0; i < 12; i++) {
    agregarIngresoClasificado(
      `TR - Traumatología, paciente ${i + 1}`,
      [120, 180, 250, 400, 550][Math.floor(Math.random() * 5)],
      catTraumatologia.id
    );
  }

  // Odontología
  for (let i = 0; i < 8; i++) {
    agregarIngresoClasificado(
      `Odontología - paciente ${i + 1}`,
      [90, 150, 200, 320][Math.floor(Math.random() * 4)],
      catOdontologia.id
    );
  }

  // Otros ingresos del mes (sin código de área reconocido)
  for (let i = 0; i < 4; i++) {
    agregarIngresoClasificado(`Otros servicios - paciente ${i + 1}`, [100, 180, 260][Math.floor(Math.random() * 3)], catOtrosIngresos.id);
  }

  // --- Egresos (últimos 60 días, sin cambios respecto al prototipo original) ---
  for (let i = 0; i < 25; i++) {
    const dias = Math.floor(Math.random() * 60);
    const fecha = new Date(hoy.getTime() - dias * 24 * 3600 * 1000);
    const cat = catsEgreso[Math.floor(Math.random() * catsEgreso.length)];
    transacciones.push({
      tipo: "EGRESO",
      monto: Math.round((80 + Math.random() * 900) * 100) / 100,
      fecha,
      categoriaId: cat.id,
      descripcion: "Gasto - " + cat.nombre,
      metodoPago: "TRANSFERENCIA",
      usuarioId: gerente.id,
      area: null,
      subclaseBP: null,
    });
  }

  for (const t of transacciones) {
    await prisma.transaccion.create({ data: t });
  }

  // ---------- SOLICITUDES DE COMPRA ----------
  const logistica = await prisma.usuario.findUnique({ where: { email: "logistica@policlinico.pe" } });
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0001",
      area: "Logística",
      justificacion: "Reposición de jeringas descartables, stock por debajo del mínimo.",
      montoEstimado: 450,
      estado: "PENDIENTE",
      solicitanteId: logistica!.id,
      items: {
        create: [
          { descripcion: "Jeringas descartables 3ml (caja x100)", cantidad: 5, precioEstimado: 90 },
        ],
      },
    },
  });
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0002",
      area: "Marketing",
      justificacion: "Impresión de material gráfico para campaña de verano.",
      montoEstimado: 620,
      estado: "APROBADA",
      solicitanteId: gerente.id,
      aprobadorId: admin.id,
      fechaResolucion: new Date(),
      comentarioResolucion: "Aprobado dentro de presupuesto de marketing.",
      items: {
        create: [
          { descripcion: "Banners y volantes", cantidad: 1, precioEstimado: 620 },
        ],
      },
    },
  });

  // ---------- BIODATA DEL DOCTOR (últimos 14 días, para poblar el gráfico) ----------
  let pesoBase = 78.5;
  const alturaCm = 175;
  for (let i = 13; i >= 0; i--) {
    const fecha = new Date(hoy.getTime() - i * 24 * 3600 * 1000);
    pesoBase += (Math.random() - 0.55) * 0.3; // leve tendencia a la baja
    const pesoKg = Math.round(pesoBase * 10) / 10;
    const alturaM = alturaCm / 100;
    await prisma.metricaSalud.create({
      data: {
        usuarioId: doctor.id,
        fecha,
        pesoKg,
        alturaCm,
        imc: Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10,
        presionSistolica: 110 + Math.floor(Math.random() * 15),
        presionDiastolica: 70 + Math.floor(Math.random() * 10),
      },
    });
  }

  console.log("Seed completado.");
  console.log("Usuarios de prueba (password para todos: policlinico2026):");
  console.log("  admin@policlinico.pe          -> Administrador");
  console.log("  gerencia@policlinico.pe       -> Gerente");
  console.log("  logistica@policlinico.pe      -> Logística");
  console.log("  contabilidad@policlinico.pe   -> Contador (solo lectura)");
  console.log("  doctor@policlinico.pe         -> Doctor (biodata)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
