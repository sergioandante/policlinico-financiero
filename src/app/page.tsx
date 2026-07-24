import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { rutaInicioParaRol } from "@/lib/permisos";

export default async function Home() {
  const session = await auth();
  redirect(rutaInicioParaRol(session?.user?.rol));
}
