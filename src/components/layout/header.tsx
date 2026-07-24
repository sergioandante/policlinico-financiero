"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { NOMBRES_ROL, type Rol } from "@/lib/permisos";

export function Header({ nombre, rol }: { nombre: string; rol: Rol }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3.5">
      <div className="md:hidden font-display font-bold text-brand-700">Policlínico</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-tight">{nombre}</p>
          <p className="text-xs text-muted-foreground leading-tight">{NOMBRES_ROL[rol]}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
          {nombre.charAt(0)}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
