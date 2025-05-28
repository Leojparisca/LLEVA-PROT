
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
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";


const loginSchema = z.object({
  emailOrPhone: z.string().min(1, { message: "Email o Número de Teléfono es requerido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  function onSubmit(values: LoginFormValues) {
    console.log("Login submitted (simulated actual login):", values);
    
    // Simulate successful login
    localStorage.setItem('isSimulatedLoggedIn', 'true');

    toast({
      title: "¡Inicio de Sesión Exitoso!",
      description: "Serás redirigido a la página principal.",
    });
    router.push("/"); 
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4"> {/* Adjusted min-height for header+footer */}
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <CardHeader className="text-center space-y-2 pt-8">
          <Icons.login className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">¡Bienvenido de Nuevo!</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="submit" className="w-full text-lg py-6 mt-2">
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pb-8">
          <Button variant="link" asChild className="text-sm text-muted-foreground hover:text-primary">
            <Link href="#">¿Olvidaste tu contraseña?</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
