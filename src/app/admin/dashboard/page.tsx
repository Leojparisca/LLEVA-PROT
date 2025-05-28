
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - en una app real, esto vendría de una API
const mockUsers = [
  { id: "u1", name: "Juan Pérez", email: "juan@example.com", role: "Cliente", status: "Activo" },
  { id: "u2", name: "Ana Gómez", email: "ana@example.com", role: "Conductor", status: "Activo" },
  { id: "u3", name: "Carlos Ruiz", email: "carlos@example.com", role: "Repartidor", status: "Pendiente" },
];

const mockVehicles = [
  { id: "v1", driver: "Ana Gómez", type: "Carro", model: "Toyota Corolla", year: 2020, plate: "AB123CD", status: "Verificado" },
  { id: "v2", driver: "Luis Paz", type: "Moto", model: "Bera SBR", year: 2022, plate: "XY789Z", status: "Pendiente Verificación" },
];


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isAdminLoggedIn) {
      router.replace("/admin/login");
      toast({
        title: "Acceso Denegado",
        description: "Por favor, inicia sesión como administrador.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión del panel de administración.",
    });
    router.push("/admin/login");
  };

  if (!isClient || !localStorage.getItem("isAdminLoggedIn")) {
    // Muestra un loader o nada mientras se verifica el estado de login y se renderiza en cliente
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Icons.settings className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Icons.logo className="h-10 w-10" />
          <h1 className="text-3xl font-bold text-foreground">Panel de Administración LLEVA</h1>
        </div>
        <Button onClick={handleLogout} variant="outline">
          <Icons.logout className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="vehicles">Gestión de Vehículos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Bienvenido al Panel de Administrador</CardTitle>
              <CardDescription>
                Aquí puedes gestionar usuarios, vehículos y monitorear la actividad de la plataforma.
                Recuerda que este es un prototipo y muchas funcionalidades avanzadas y de seguridad
                requieren implementación de backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Métricas y resumen del sistema irían aquí.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Icons.users className="h-5 w-5 text-primary"/> Usuarios Registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{mockUsers.length}</p>
                    <p className="text-sm text-muted-foreground">Total de usuarios en el sistema.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Icons.truck className="h-5 w-5 text-primary"/> Vehículos Registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{mockVehicles.length}</p>
                    <p className="text-sm text-muted-foreground">Total de vehículos en la plataforma.</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Gestión de Usuarios</CardTitle>
              <CardDescription>Ver y administrar los usuarios de la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Esta es una tabla de ejemplo. Funcionalidades como editar, eliminar, cambiar roles,
                y filtros avanzados requerirían integración con un backend.
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {mockUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{user.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{user.role}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === "Activo" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                            user.status === "Pendiente" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Button variant="outline" size="sm" onClick={() => toast({ title: "Acción no implementada", description: `Ver/Editar usuario ${user.name}`})}>Ver/Editar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Gestión de Vehículos</CardTitle>
              <CardDescription>Ver y administrar los vehículos registrados por los conductores.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Esta es una tabla de ejemplo. Funcionalidades como aprobar/rechazar vehículos,
                ver documentos, y filtros avanzados requerirían integración con un backend.
              </p>
              <div className="overflow-x-auto rounded-md border">
                 <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Conductor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Modelo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Año</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Placa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {mockVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{vehicle.driver}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{vehicle.type}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{vehicle.model}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{vehicle.year}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{vehicle.plate}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                           <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            vehicle.status === "Verificado" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Button variant="outline" size="sm" onClick={() => toast({ title: "Acción no implementada", description: `Ver/Gestionar vehículo ${vehicle.plate}`})}>Ver/Gestionar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
