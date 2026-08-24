"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";

const esquema = z.object({
  nombre: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.enum(["ADMINISTRADOR", "GERENTE", "LOGISTICA", "CONTADOR"]),
});

export async function crearUsuario(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarUsuarios")) {
    return { ok: false, error: "No tienes permiso para gestionar usuarios." };
  }

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existente = await prisma.usuario.findUnique({ where: { email: parsed.data.email } });
  if (existente) return { ok: false, error: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: parsed.data.rol,
    },
  });

  revalidatePath("/usuarios");
  return { ok: true, error: null };
}

export async function cambiarEstadoUsuario(usuarioId: string, activo: boolean) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarUsuarios")) {
    return { ok: false, error: "No tienes permiso para gestionar usuarios." };
  }
  if (usuarioId === session.user.id) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { activo } });
  revalidatePath("/usuarios");
  return { ok: true, error: null };
}
