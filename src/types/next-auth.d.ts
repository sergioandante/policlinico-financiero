import { Rol } from "@/lib/permisos";

declare module "next-auth" {
  interface User {
    rol: Rol;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      rol: Rol;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol: Rol;
    id: string;
  }
}
