
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

// Mock data for profile
const mockUser = {
  name: "Alex Rider",
  email: "alex.rider@example.com",
  phone: "+15550101",
  avatarUrl: "https://placehold.co/100x100.png",
  edad: 28, // Added
  paymentMethods: [
    { id: "pm1", type: "Visa", last4: "4242", expiry: "12/25" },
  ],
  transportPreferences: {
    preferredVehicle: "taxi", 
    accessibilityNeeds: false,
  },
};

const profileSchema = z.object({
  name: z.string().min(2, "El nombre es demasiado corto"),
  email: z.string().email("Dirección de email inválida"),
  phone: z.string().min(10, "Número de teléfono inválido").regex(/^\+?[1-9]\d{1,14}$/, "Formato de número de teléfono inválido"),
  edad: z.number().min(18, "Debes ser mayor de edad").max(120, "Edad inválida"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "El número de tarjeta debe tener 16 dígitos"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Vencimiento inválido (MM/AA)"),
  cvc: z.string().regex(/^\d{3,4}$/, "CVC debe tener 3 o 4 dígitos"),
  cardHolderName: z.string().min(2, "El nombre del titular es requerido"),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState(mockUser);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: user.name,
      email: user.email,
      phone: user.phone,
      edad: user.edad,
    },
  });

  useEffect(() => {
    profileForm.reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
        edad: user.edad,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profileForm.reset]);


  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { cardNumber: "", expiryDate: "", cvc: "", cardHolderName: "" },
  });

  function onProfileSubmit(values: ProfileFormValues) {
    console.log("Profile updated:", values);
    setUser(prev => ({ ...prev, ...values }));
    toast({ title: "Perfil Actualizado", description: "Tu información personal ha sido guardada." });
  }

  function onPaymentSubmit(values: PaymentFormValues) {
    console.log("Payment method added:", values);
    const newPaymentMethod = { 
      id: `pm${user.paymentMethods.length + 1}`, 
      type: "Nueva Tarjeta", 
      last4: values.cardNumber.slice(-4), 
      expiry: values.expiryDate 
    };
    setUser(prev => ({ ...prev, paymentMethods: [...prev.paymentMethods, newPaymentMethod] }));
    paymentForm.reset();
    toast({ title: "Método de Pago Agregado", description: "Tu nueva tarjeta ha sido guardada." });
  }
  
  function handlePreferencesChange(field: keyof typeof user.transportPreferences, value: any) {
    setUser(prev => ({
      ...prev,
      transportPreferences: {
        ...prev.transportPreferences,
        [field]: value,
      },
    }));
    console.log("Preferences updated:", { field, value });
  }
  
  function savePreferences() {
     toast({ title: "Preferencias Guardadas", description: "Tus preferencias de transporte han sido actualizadas." });
  }


  if (!isClient) return null; 

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-xl rounded-lg">
        <CardHeader className="items-center text-center pt-8 space-y-3">
          <Avatar className="w-24 h-24 mb-2 ring-2 ring-primary ring-offset-background ring-offset-2">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
            <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="payment">Pago</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Teléfono</FormLabel>
                        <FormControl><Input type="tel" placeholder="+1234567890" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="edad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <FormControl><Input type="number" placeholder="Tu edad" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto">Guardar Cambios</Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="payment" className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Métodos de Pago Guardados</h3>
                {user.paymentMethods.length > 0 ? (
                  <ul className="space-y-3">
                    {user.paymentMethods.map(method => (
                      <li key={method.id} className="flex justify-between items-center p-4 border rounded-md bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <Icons.creditCard className="h-6 w-6 text-primary" />
                          <span className="font-medium">{method.type === "New Card" ? "Nueva Tarjeta" : method.type} terminada en {method.last4}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Expira {method.expiry}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground py-4 text-center">No hay métodos de pago guardados.</p>
                )}
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4 text-foreground">Agregar Nuevo Método de Pago</h3>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                     <FormField
                        control={paymentForm.control}
                        name="cardHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Titular de la Tarjeta</FormLabel>
                            <FormControl><Input placeholder="Nombre como aparece en la tarjeta" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Tarjeta</FormLabel>
                            <FormControl><Input placeholder="•••• •••• •••• ••••" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vencimiento (MM/AA)</FormLabel>
                            <FormControl><Input placeholder="MM/AA" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl><Input placeholder="•••" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full md:w-auto">Agregar Tarjeta</Button>
                  </form>
                </Form>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="preferredVehicle" className="text-base font-medium">Tipo de Vehículo Preferido</Label>
                <Select 
                  value={user.transportPreferences.preferredVehicle} 
                  onValueChange={(value) => handlePreferencesChange('preferredVehicle', value)}
                >
                  <SelectTrigger id="preferredVehicle" className="mt-1">
                    <SelectValue placeholder="Selecciona vehículo preferido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Cualquiera</SelectItem>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="moto-taxi">Moto-Taxi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="accessibilityNeeds" className="text-base font-medium">Necesidades de Accesibilidad</Label>
                  <p className="text-sm text-muted-foreground mt-1">Solicitar vehículos con características de accesibilidad.</p>
                </div>
                <Switch
                  id="accessibilityNeeds"
                  checked={user.transportPreferences.accessibilityNeeds}
                  onCheckedChange={(checked) => handlePreferencesChange('accessibilityNeeds', checked)}
                  aria-label="Toggle accessibility needs"
                />
              </div>
               <Button onClick={savePreferences} className="w-full md:w-auto">Guardar Preferencias</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
