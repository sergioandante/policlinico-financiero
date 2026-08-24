"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Correo o contraseña incorrectos.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-800 text-brand-50 p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-brand-700/40" />
        <div className="absolute -right-10 bottom-10 w-64 h-64 rounded-full bg-brand-600/30" />
        <div className="relative z-10 flex items-center gap-2 font-display font-bold text-lg">
          <Logo variant="light" className="w-7 h-7 shrink-0" />
          Policlínico San Damián
        </div>
        <div className="relative z-10 space-y-4 max-w-sm">
          <p className="font-display text-3xl font-semibold leading-tight">
            Control real de caja chica, caja grande y rentabilidad.
          </p>
          <p className="text-brand-100/80 text-sm">
            Un solo lugar para ingresos, egresos, traspasos y presupuestos —
            sin depender de hojas de Excel dispersas.
          </p>
        </div>
        <p className="relative z-10 text-xs text-brand-100/60">
          Prototipo v0.1 — Uso interno del policlínico
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-ink">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu correo institucional.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@policlinico.pe"
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ingresar <ArrowRight className="w-4 h-4" /></>}
          </button>

          <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Usuarios de prueba (seed):</p>
            <p>admin@policlinico.pe · gerencia@policlinico.pe</p>
            <p>logistica@policlinico.pe · contabilidad@policlinico.pe</p>
            <p>Contraseña para todos: <span className="font-mono">policlinico2026</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}
