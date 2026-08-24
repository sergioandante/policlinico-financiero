import type { NextAuthConfig } from "next-auth";

// Esta config NO incluye el Credentials provider (que depende de Prisma +
// bcrypt, incompatibles con el Edge Runtime). El middleware solo necesita
// decodificar la cookie de sesión — no ejecutar el login — así que puede
// vivir en Edge sin problema. El provider real se agrega en `auth.ts`,
// que es el que corren la ruta API y los Server Components/Actions (Node.js).
export const authConfig = {
  // En Vercel, cada preview deployment (rama/PR) tiene su propia URL, que
  // cambia constantemente. Sin esto, NextAuth intenta construir las URLs
  // de redirección con AUTH_URL/NEXTAUTH_URL (si está seteada, p.ej. a
  // localhost para desarrollo local) en vez del host real de la request,
  // mandando a los usuarios a una URL equivocada después del login.
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as any).rol;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).rol = token.rol;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
