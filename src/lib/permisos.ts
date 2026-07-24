export type Rol = "ADMINISTRADOR" | "GERENTE" | "LOGISTICA" | "CONTADOR" | "DOCTOR";

/**
 * Matriz de permisos. Cambiar la lógica de acceso a un módulo en TODA la app
 * significa editar solo este archivo.
 *
 * ADMINISTRADOR: acceso total, incluye gestión de usuarios.
 * GERENTE: gestión financiera completa (cajas, transacciones, presupuestos,
 *          aprobación de compras), sin gestión de usuarios.
 * LOGISTICA: crea solicitudes de compra y gestiona inventario. No ve montos
 *            de caja ni puede registrar transacciones.
 * CONTADOR: solo lectura de todo lo financiero. No puede crear/editar nada.
 * DOCTOR: sin acceso al módulo financiero. Solo ve y registra su propia
 *         biodata (peso, IMC, presión arterial) — nunca la de otros doctores.
 */
export const PERMISOS = {
  verDashboard: ["ADMINISTRADOR", "GERENTE", "CONTADOR"] as Rol[],
  verReportes: ["ADMINISTRADOR", "GERENTE", "CONTADOR"] as Rol[],
  verTransacciones: ["ADMINISTRADOR", "GERENTE", "CONTADOR"] as Rol[],
  crearTransacciones: ["ADMINISTRADOR", "GERENTE"] as Rol[],
  importarExcel: ["ADMINISTRADOR", "GERENTE"] as Rol[],
  verCajas: ["ADMINISTRADOR", "GERENTE", "CONTADOR"] as Rol[],
  registrarMovimientoCaja: ["ADMINISTRADOR", "GERENTE"] as Rol[],
  verPresupuestos: ["ADMINISTRADOR", "GERENTE", "CONTADOR"] as Rol[],
  editarPresupuestos: ["ADMINISTRADOR", "GERENTE"] as Rol[],
  verInventario: ["ADMINISTRADOR", "GERENTE", "LOGISTICA"] as Rol[],
  editarInventario: ["ADMINISTRADOR", "LOGISTICA"] as Rol[],
  verCompras: ["ADMINISTRADOR", "GERENTE", "LOGISTICA"] as Rol[],
  crearSolicitudCompra: ["ADMINISTRADOR", "GERENTE", "LOGISTICA"] as Rol[],
  aprobarSolicitudCompra: ["ADMINISTRADOR", "GERENTE"] as Rol[],
  gestionarUsuarios: ["ADMINISTRADOR"] as Rol[],
  verBiodata: ["DOCTOR"] as Rol[],
  registrarBiodata: ["DOCTOR"] as Rol[],
};

export function puede(rol: Rol | undefined, accion: keyof typeof PERMISOS): boolean {
  if (!rol) return false;
  return PERMISOS[accion].includes(rol);
}

export const NOMBRES_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  GERENTE: "Gerente",
  LOGISTICA: "Logística",
  CONTADOR: "Contador (solo lectura)",
  DOCTOR: "Doctor",
};

// Ruta de aterrizaje según rol: evita loops de redirect cuando un rol (ej.
// DOCTOR) no tiene acceso al dashboard financiero por defecto.
export function rutaInicioParaRol(rol: Rol | undefined): string {
  if (puede(rol, "verDashboard")) return "/dashboard";
  if (puede(rol, "verBiodata")) return "/biodata";
  if (puede(rol, "verInventario")) return "/inventario";
  if (puede(rol, "verCompras")) return "/compras";
  return "/login";
}
