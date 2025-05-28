
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres" }),
  emailOrPhone: z.string().min(1, { message: "Email o Número de Teléfono es requerido" })
    .refine(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[1-9]\d{1,14}$/.test(value), {
      message: "Por favor, ingrese un email o número de teléfono válido (ej: +1234567890)"
    }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "Por favor, confirma tu contraseña" }),
  userType: z.enum(["customer", "driver", "delivery_person"], { required_error: "Por favor, selecciona un tipo de cuenta" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      emailOrPhone: "",
      password: "",
      confirmPassword: "",
      userType: undefined,
    },
  });

  function onSubmit(values: RegisterFormValues) {
    console.log("Registration submitted:", values);
    // TODO: Implement actual registration logic
    
    if (values.userType === "customer") {
      toast({
        title: "¡Registro Exitoso!",
        description: "Serás redirigido para completar tu perfil.",
      });
      router.push("/profile"); 
    } else if (values.userType === "driver") {
      toast({
        title: "¡Paso 1 Completado!",
        description: "Serás redirigido para completar tu perfil de conductor.",
      });
      router.push("/driver-profile"); // Redirect to driver profile page
    } else if (values.userType === "delivery_person") {
       toast({
        title: "Registro Enviado (Simulación)",
        description: "La funcionalidad de registro para repartidores aún no está implementada completamente. Serás redirigido para completar tu perfil de repartidor (Próximamente).",
      });
      // Potentially redirect to a delivery_person-profile page in the future
      // router.push("/delivery-person-profile"); 
      router.push("/"); // Placeholder redirect
    }
    // form.reset(); // Reset form only if not redirecting or based on specific logic
  }

  const handleAffiliateCommerce = () => {
    toast({
      title: "Afiliación de Comercios",
      description: "Esta funcionalidad estará disponible próximamente. ¡Gracias por tu interés!",
      duration: 5000,
    });
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg shadow-xl rounded-lg">
        <CardHeader className="text-center space-y-2 pt-8">
          <Icons.user className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">Crear una Cuenta</CardTitle>
          <CardDescription>Únete a LLEVA hoy para empezar a viajar, conducir o repartir.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailOrPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email o Número de Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@ejemplo.com o +1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soy un...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de cuenta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="driver">Conductor</SelectItem>
                        <SelectItem value="delivery_person">Repartidor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-6 mt-2">
                Registrarse
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pb-8">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Iniciar Sesión
            </Link>
          </p>
          <Button variant="outline" onClick={handleAffiliateCommerce} className="w-full max-w-xs">
            <Icons.store className="mr-2 h-4 w-4" />
            Afiliar mi Comercio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
