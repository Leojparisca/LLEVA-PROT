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
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/auth";
import { getUserTrips } from "@/lib/trips";
import { getUserDeliveryOrders } from "@/lib/delivery";
import { getUserRatings } from "@/lib/ratings";

// Mock data for payment methods (could be expanded later)
const mockPaymentMethods = [
  { id: "pm1", type: "Visa", last4: "4242", expiry: "12/25" },
];

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre es demasiado corto"),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  age: z.number().min(18, "Debes ser mayor de edad").max(120, "Edad inválida").optional().nullable(),
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
  const { user, profile, refreshProfile } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [userDeliveries, setUserDeliveries] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [transportPreferences, setTransportPreferences] = useState({
    preferredVehicle: "any",
    accessibilityNeeds: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load user data when profile is available
  useEffect(() => {
    if (user && profile) {
      loadUserData();
    }
  }, [user, profile]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load trips
      const { data: trips, error: tripsError } = await getUserTrips(user.id);
      if (trips && !tripsError) {
        setUserTrips(trips);
      }

      // Load delivery orders
      const { data: deliveries, error: deliveriesError } = await getUserDeliveryOrders(user.id);
      if (deliveries && !deliveriesError) {
        setUserDeliveries(deliveries);
      }

      // Load ratings given by user
      const { data: ratings, error: ratingsError } = await getUserRatings(user.id);
      if (ratings && !ratingsError) {
        setUserRatings(ratings);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      city: profile?.city || "",
      age: profile?.age || undefined,
    },
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        age: profile.age || undefined,
      });
    }
  }, [profile, profileForm]);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { cardNumber: "", expiryDate: "", cvc: "", cardHolderName: "" },
  });

  async function onProfileSubmit(values: ProfileFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await updateUserProfile(user.id, values);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error al Actualizar",
          description: "No se pudo actualizar tu perfil. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        await refreshProfile();
        toast({
          title: "Perfil Actualizado",
          description: "Tu información personal ha sido guardada.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  function onPaymentSubmit(values: PaymentFormValues) {
    console.log("Payment method added:", values);
    const newPaymentMethod = {
      id: `pm${paymentMethods.length + 1}`,
      type: "Nueva Tarjeta",
      last4: values.cardNumber.slice(-4),
      expiry: values.expiryDate
    };
    setPaymentMethods(prev => [...prev, newPaymentMethod]);
    paymentForm.reset();
    toast({ 
      title: "Método de Pago Agregado", 
      description: "Tu nueva tarjeta ha sido guardada." 
    });
  }

  function handlePreferencesChange(field: keyof typeof transportPreferences, value: any) {
    setTransportPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
    console.log("Preferences updated:", { field, value });
  }

  function savePreferences() {
    toast({ 
      title: "Preferencias Guardadas", 
      description: "Tus preferencias de transporte han sido actualizadas." 
    });
  }

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Usuario";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_progress':
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'delivered':
        return 'Entregado';
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'in_transit':
        return 'En Tránsito';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="w-full max-w-md mx-auto shadow-xl rounded-lg">
          <CardHeader className="text-center pt-8">
            <Icons.user className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="text-2xl font-bold">Acceso Requerido</CardTitle>
            <CardDescription>Debes iniciar sesión para ver tu perfil.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-xl rounded-lg">
        <CardHeader className="items-center text-center pt-8 space-y-3">
          <Avatar className="w-24 h-24 mb-2 ring-2 ring-primary ring-offset-background ring-offset-2">
            <AvatarImage src={profile?.avatar_url || ""} alt={getUserDisplayName()} data-ai-hint="person portrait" />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{getUserDisplayName()}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          {profile?.user_type && (
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
              {profile.user_type === "customer" && "Cliente"}
              {profile.user_type === "driver" && "Conductor"}
              {profile.user_type === "delivery_person" && "Repartidor"}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="payment">Pago</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Teléfono</FormLabel>
                          <FormControl><Input type="tel" placeholder="+1234567890" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl><Input placeholder="Tu ciudad" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Tu edad" 
                            {...field} 
                            value={field.value || ""} 
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Historial de Viajes</h3>
                {userTrips.length > 0 ? (
                  <div className="space-y-3">
                    {userTrips.slice(0, 5).map((trip) => (
                      <div key={trip.id} className="flex justify-between items-center p-4 border rounded-md bg-card">
                        <div className="flex-1">
                          <p className="font-medium">{trip.pickup_location} → {trip.destination}</p>
                          <p className="text-sm text-muted-foreground">
                            {trip.vehicle_type} {trip.taxi_type && `(${trip.taxi_type})`} • {formatDate(trip.created_at)}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {getStatusText(trip.status)}
                        </div>
                      </div>
                    ))}
                    {userTrips.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {userTrips.length - 5} viajes más...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4 text-center">No tienes viajes registrados.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Historial de Entregas</h3>
                {userDeliveries.length > 0 ? (
                  <div className="space-y-3">
                    {userDeliveries.slice(0, 5).map((delivery) => (
                      <div key={delivery.id} className="flex justify-between items-center p-4 border rounded-md bg-card">
                        <div className="flex-1">
                          <p className="font-medium">{delivery.pickup_location} → {delivery.delivery_location}</p>
                          <p className="text-sm text-muted-foreground">
                            {delivery.merchant?.name || 'Comercio'} • {formatDate(delivery.created_at)}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </div>
                      </div>
                    ))}
                    {userDeliveries.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {userDeliveries.length - 5} entregas más...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4 text-center">No tienes entregas registradas.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Métodos de Pago Guardados</h3>
                {paymentMethods.length > 0 ? (
                  <ul className="space-y-3">
                    {paymentMethods.map(method => (
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
                  value={transportPreferences.preferredVehicle} 
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
                  checked={transportPreferences.accessibilityNeeds}
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
