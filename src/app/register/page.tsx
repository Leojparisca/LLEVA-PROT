"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { signUp } from "@/lib/auth";
import { createClient } from "@/lib/supabase";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Por favor, ingresa un email válido" }),
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: undefined,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      const { data, error } = await signUp(values.email, values.password, values.fullName, values.userType);
      
      if (error) {
        toast({
          title: "Error de Registro",
          description: error.message === "User already registered"
            ? "Ya existe una cuenta con este email."
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Create user profile in the database
        const supabase = createClient();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: values.fullName,
            user_type: values.userType,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Don't show error to user as auth was successful
        }

        toast({
          title: "¡Registro Exitoso!",
          description: "Verifica tu email para activar tu cuenta.",
        });

        // Redirect based on user type
        if (values.userType === "customer") {
          router.push("/profile");
        } else if (values.userType === "driver") {
          router.push("/driver-profile");
        } else if (values.userType === "delivery_person") {
          router.push("/profile"); // Could be a delivery-person-profile page in the future
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                      <Input 
                        placeholder="Juan Pérez" 
                        disabled={isLoading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="tu@ejemplo.com" 
                        disabled={isLoading}
                        {...field} 
                      />
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
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        disabled={isLoading}
                        {...field} 
                      />
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
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        disabled={isLoading}
                        {...field} 
                      />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
              <Button 
                type="submit" 
                className="w-full text-lg py-6 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Registrándose...
                  </>
                ) : (
                  "Registrarse"
                )}
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
