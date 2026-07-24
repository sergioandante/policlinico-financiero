# Módulo Financiero y Administrativo — Policlínico

Prototipo funcional enfocado en control de caja, transacciones, presupuestos,
inventario básico y solicitudes de compra. **No incluye módulo clínico ni
pacientes/doctores** (eso va en la iteración 2).

## Stack técnico y por qué se eligió así para un prototipo

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components + Server Actions reducen boilerplate de API para un MVP |
| UI | Tailwind + shadcn/ui (Radix) | Look profesional rápido, accesible por defecto |
| Base de datos | **SQLite** vía Prisma | Cero configuración externa — corre con `npm install` y ya. El schema está escrito para migrar a PostgreSQL/Supabase cambiando 2 líneas (ver abajo) |
| Auth | **NextAuth (Auth.js) v5** con credenciales propias | No depende de crear cuenta en Clerk/Supabase para la demo; se migra después si el cliente lo prefiere |
| Gráficos | Recharts | Maduro, liviano, se integra bien con Tailwind |
| Excel | SheetJS (`xlsx`) | Parseo en el navegador con preview antes de confirmar importación |

> Cuando pasen a producción, lo único que cambia para usar Supabase es:
> `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`
> en `prisma/schema.prisma`, y apuntar `DATABASE_URL` a la cadena de Supabase.
> El resto del código (queries, server actions) no cambia porque todo pasa por Prisma.

## Estructura del proyecto

```
policlinico-financiero/
├── prisma/
│   ├── schema.prisma        # Modelo de datos completo
│   └── seed.ts               # Datos de ejemplo (usuarios, cajas, categorías...)
├── src/
│   ├── app/
│   │   ├── login/                        # Login
│   │   ├── (dashboard)/                  # Layout protegido con sidebar
│   │   │   ├── dashboard/                # KPIs, gráficos, anomalías
│   │   │   ├── transacciones/            # Listado, form, importar Excel
│   │   │   ├── cajas/                    # Caja Chica/Grande, movimientos, traspasos
│   │   │   ├── presupuestos/             # Presupuestos por categoría
│   │   │   ├── inventario/               # Stock, alertas de vencimiento
│   │   │   ├── compras/                  # Solicitudes de compra
│   │   │   └── usuarios/                 # Gestión de usuarios (solo Admin)
│   │   └── api/
│   │       ├── auth/[...nextauth]/       # NextAuth
│   │       └── transacciones/importar/   # Recibe filas parseadas del Excel
│   ├── components/
│   │   ├── ui/            # shadcn/ui (button, card, dialog, select, table...)
│   │   ├── dashboard/      # KPI cards, gráficos
│   │   ├── cajas/          # Movimiento y traspaso (lo más crítico)
│   │   ├── transacciones/  # Form + importador de Excel
│   │   ├── presupuestos/, inventario/, compras/, usuarios/
│   │   └── layout/         # Sidebar, header
│   ├── lib/
│   │   ├── auth.ts         # Config NextAuth
│   │   ├── permisos.ts     # Matriz de permisos por rol (fuente única de verdad)
│   │   ├── prisma.ts       # Cliente Prisma
│   │   ├── actions/        # Server Actions (mutaciones): cajas, transacciones, compras...
│   │   └── consultas/      # Queries de lectura (Server Components)
│   └── middleware.ts       # Protección de rutas por sesión
├── components.json         # Config de shadcn/ui (por si agregan más componentes)
└── package.json
```

## Instrucciones para correr el prototipo localmente

### 1. Requisitos previos
- Node.js 20+ instalado
- npm 10+

### 2. Instalar dependencias

```bash
cd policlinico-financiero
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Genera un secreto para NextAuth y pégalo en `AUTH_SECRET` dentro de `.env`:

```bash
openssl rand -base64 32
```

(En Windows sin OpenSSL, puedes usar cualquier cadena aleatoria larga — solo para desarrollo local.)

### 4. Crear la base de datos y cargar datos de ejemplo

```bash
npm run db:generate   # genera el cliente Prisma
npm run db:migrate    # crea las tablas (SQLite) a partir del schema
npm run db:seed       # carga usuarios, cajas, categorías, presupuesto de marketing, etc.
```

### 5. Agregar los componentes de shadcn/ui que faltan (opcional)

Ya incluí escritos a mano los componentes que usan las pantallas principales
(Button, Card, Table, Dialog, Select, Badge, Input, Label, Textarea, Progress).
Si en la siguiente iteración necesitas más (Tabs, Avatar, Dropdown, Calendar...),
instálalos con el CLI en vez de escribirlos a mano:

```bash
npx shadcn@latest add tabs avatar dropdown-menu calendar
```

### 6. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te redirige a `/login`.

### 7. Usuarios de prueba (creados por el seed)

| Correo | Rol | Contraseña |
|---|---|---|
| admin@policlinico.pe | Administrador | policlinico2026 |
| gerencia@policlinico.pe | Gerente | policlinico2026 |
| logistica@policlinico.pe | Logística | policlinico2026 |
| contabilidad@policlinico.pe | Contador (solo lectura) | policlinico2026 |

### 8. Formato esperado del Excel para importar ventas históricas

Columnas (en `/transacciones/importar`):

| Fecha | Tipo | Categoria | Monto | Descripcion | MetodoPago |
|---|---|---|---|---|---|
| 2026-06-01 | Ingreso | Programa Pérdida de Peso - Premium | 850 | Pago paciente Juan Pérez | Transferencia |

- `Tipo` acepta "Ingreso"/"Egreso" (sin distinguir mayúsculas/tildes).
- `Categoria` debe coincidir con el **nombre exacto** de una categoría ya
  configurada en el sistema (el importador te muestra qué filas no
  encontraron match antes de guardar nada).

### Comandos útiles adicionales

```bash
npm run db:studio   # Explorador visual de la base de datos (Prisma Studio)
npm run db:reset    # Borra todo y vuelve a correr migraciones + seed
npm run build        # Build de producción
```

## Decisiones de diseño relevantes para el cliente

1. **Todo movimiento de caja pasa por `prisma.$transaction`.** Un traspaso
   entre Caja Chica y Caja Grande genera *dos* filas ligadas (salida +
   entrada) de forma atómica: si algo falla, no queda una caja descuadrada.
2. **El saldo de cada caja es un campo denormalizado** (`Caja.saldoActual`)
   que se actualiza en cada movimiento, pero el historial completo en
   `MovimientoCaja` permite auditar y reconstruir el saldo en cualquier
   fecha si hiciera falta.
3. **Los roles controlan tanto la navegación como las Server Actions.**
   La matriz vive en un solo archivo (`lib/permisos.ts`), así que agregar un
   rol nuevo o cambiar qué puede hacer "Logística" es un cambio en un solo
   lugar, no en cada pantalla.
4. **Detección de anomalías v1** compara cada egreso contra el promedio
   histórico de su categoría (bandera si supera 2.5x). Es una heurística
   simple a propósito — pensada para mostrarle valor al cliente ya, y
   perfeccionable con series de tiempo más adelante.

## Sugerencias para la Iteración 2 (Módulo Clínico)

1. **Pacientes y Doctores**: nuevas entidades `Paciente` y `Doctor`, con
   `Transaccion` ganando un `pacienteId` opcional para conectar cada ingreso
   con el paciente que lo generó — esto habilita "rentabilidad por paciente"
   y "rentabilidad por programa" en el Dashboard.
2. **Programas de pérdida de peso como catálogo propio**: hoy "Programa
   Básico/Premium" son solo categorías de ingreso; conviene un modelo
   `ProgramaTratamiento` con duración, precio base y sesiones incluidas,
   para poder facturar y dar seguimiento clínico.
3. **Historias clínicas y seguimiento de peso/medidas**: tabla de consultas
   con fecha, peso, medidas, notas del profesional — típicamente con
   control de acceso más estricto (solo el doctor asignado + Admin).
4. **Vincular Inventario con consumo clínico**: cuando el doctor aplique una
   vacuna/insumo en consulta, descontar stock automáticamente en vez de
   requerir el ajuste manual que existe hoy.
5. **Agenda y citas**: calendario de citas por doctor, con recordatorios.
6. **Reportes de rentabilidad por programa/doctor**: una vez exista el
   vínculo paciente-transacción, el Dashboard puede sumar "ingresos menos
   costo de insumos por programa" para saber cuál programa realmente deja
   más margen — que es, en el fondo, la pregunta de negocio detrás de todo
   este módulo financiero.
7. **Notificaciones**: alertas por correo/WhatsApp cuando un presupuesto
   se acerque al límite o el stock de un insumo esté por agotarse, en vez
   de depender de que alguien entre a mirar el dashboard.
8. **Auditoría más fina**: hoy cada movimiento guarda `usuarioId`; para
   clínica conviene además un log de cambios (quién editó qué campo y
   cuándo) dado que ahí sí hay datos sensibles de salud.

## Roles y permisos (resumen)

| Módulo | Administrador | Gerente | Logística | Contador |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | — | ✅ (solo lectura) |
| Transacciones | ✅ | ✅ | — | ✅ (solo lectura) |
| Importar Excel | ✅ | ✅ | — | — |
| Control de Cajas | ✅ | ✅ | — | ✅ (solo lectura) |
| Presupuestos | ✅ | ✅ | — | ✅ (solo lectura) |
| Inventario | ✅ | ✅ (lectura) | ✅ | — |
| Solicitudes de Compra | ✅ (crea y aprueba) | ✅ (crea y aprueba) | ✅ (solo crea) | — |
| Usuarios | ✅ | — | — | — |
