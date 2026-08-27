import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede, NOMBRES_ROL, type Rol } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NuevoUsuarioDialog } from "@/components/usuarios/nuevo-usuario-dialog";
import { ToggleUsuarioButton } from "@/components/usuarios/toggle-usuario-button";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "gestionarUsuarios")) redirect("/dashboard");

  const usuarios = await prisma.usuario.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Usuarios y Roles</h1>
          <p className="text-sm text-muted-foreground">Administrador, Gerente, Logística y Contador (solo lectura).</p>
        </div>
        <NuevoUsuarioDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-sm font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{NOMBRES_ROL[u.rol as Rol]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? "success" : "destructive"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <NuevoUsuarioDialog
                        usuario={{ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }}
                      />
                      <ToggleUsuarioButton usuarioId={u.id} activo={u.activo} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
