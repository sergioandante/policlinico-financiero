import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Rol } from "@/lib/permisos";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const usuario = await prisma.usuario.findUnique({
            where: { email: credentials.email as string },
          });
          console.log("[authorize] email:", credentials.email, "encontrado:", !!usuario, "activo:", usuario?.activo);

          if (!usuario || !usuario.activo) return null;

          const passwordValida = await bcrypt.compare(
            credentials.password as string,
            usuario.passwordHash
          );
          console.log("[authorize] passwordValida:", passwordValida);
          if (!passwordValida) return null;

          return {
            id: usuario.id,
            name: usuario.nombre,
            email: usuario.email,
            // Prisma tipa `rol` como String (SQLite no soporta enums nativos);
            // los valores válidos ya están validados en origen por el enum de
            // la app en src/lib/permisos.ts y por el seed/formularios de alta.
            rol: usuario.rol as Rol,
          };
        } catch (err) {
          console.error("[authorize] error:", err);
          return null;
        }
      },
    }),
  ],
});
