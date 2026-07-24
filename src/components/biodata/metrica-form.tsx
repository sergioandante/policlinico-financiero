"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrarMetricaSalud } from "@/lib/actions/biodata";

const initialState = { ok: false, error: null as string | null };

export function MetricaForm({ alturaSugerida }: { alturaSugerida?: number }) {
  const [state, formAction, pending] = useActionState(registrarMetricaSalud, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.ok) {
      toast.success("Métrica registrada correctamente.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <Input name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div className="space-y-1.5">
          <Label>Peso (kg)</Label>
          <Input name="pesoKg" type="number" step="0.1" min="1" required placeholder="70.5" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Altura (cm)</Label>
        <Input
          name="alturaCm"
          type="number"
          step="0.1"
          min="1"
          required
          defaultValue={alturaSugerida}
          placeholder="170"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Presión sistólica (mmHg)</Label>
          <Input name="presionSistolica" type="number" step="1" min="50" max="300" required placeholder="120" />
        </div>
        <div className="space-y-1.5">
          <Label>Presión diastólica (mmHg)</Label>
          <Input name="presionDiastolica" type="number" step="1" min="30" max="200" required placeholder="80" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notas (opcional)</Label>
        <Input name="notas" placeholder="Ej. Ayuno, después de ejercicio, etc." />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Registrar métrica de hoy"}
      </Button>
    </form>
  );
}
