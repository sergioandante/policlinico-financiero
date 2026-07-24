import type { NextAuthConfig } from "next-auth";

// Esta config NO incluye el Credentials provider (que depende de Prisma +
// bcrypt, incompatibles con el Edge Runtime). El middleware solo necesita
// decodificar la cookie de sesión — no ejecutar el login — así que puede
// vivir en Edge sin problema. El provider real se agrega en `auth.ts`,
// que es el que corren la ruta API y los Server Components/Actions (Node.js).
export const authConfig = {
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
