"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet2,
  PiggyBank,
  Boxes,
  ClipboardList,
  Users,
  Stethoscope,
  FileBarChart,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { puede, type Rol } from "@/lib/permisos";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permiso: "verDashboard" as const },
  { href: "/reportes", label: "Reportes Diarios", icon: FileBarChart, permiso: "verReportes" as const },
  { href: "/transacciones", label: "Transacciones", icon: ArrowLeftRight, permiso: "verTransacciones" as const },
  { href: "/cajas", label: "Control de Cajas", icon: Wallet2, permiso: "verCajas" as const },
  { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank, permiso: "verPresupuestos" as const },
  { href: "/inventario", label: "Inventario", icon: Boxes, permiso: "verInventario" as const },
  { href: "/compras", label: "Solicitudes de Compra", icon: ClipboardList, permiso: "verCompras" as const },
  { href: "/usuarios", label: "Usuarios", icon: Users, permiso: "gestionarUsuarios" as const },
  { href: "/biodata", label: "Mi Biodata", icon: HeartPulse, permiso: "verBiodata" as const },
];

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-brand-800 text-brand-50 min-h-screen p-4">
      <div className="flex items-center gap-2 px-2 py-3 font-display font-bold text-lg">
        <Wallet2 className="w-6 h-6" />
        Policlínico
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {NAV.filter((item) => puede(rol, item.permiso)).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-brand-100/80 hover:bg-brand-700/60 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-md bg-brand-700/40 p-3 text-xs text-brand-100/70 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-brand-50">
          <Stethoscope className="w-3.5 h-3.5" />
          Próxima iteración
        </div>
        <p>Módulo clínico: pacientes, doctores e historias.</p>
      </div>
    </aside>
  );
}
