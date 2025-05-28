"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createTrip, subscribeToTripUpdates } from "@/lib/trips";
import { createDeliveryOrder, subscribeToDeliveryOrderUpdates } from "@/lib/delivery";
import { getAllMerchants } from "@/lib/delivery";
import { createRating } from "@/lib/ratings";
import { seedMerchants } from "@/lib/seed-data";

interface ChatMessage {
  id: string;
  sender: 'user' | 'provider';
  text: string;
  timestamp: Date;
}

interface ActiveServiceInfo {
  id?: string;
  type: string;
  providerName: string;
  vehicle?: string;
  taxiType?: 'básico' | 'premium';
  merchantName?: string;
}

interface Merchant {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  status: string;
}

interface ReceiptDetails {
  serviceType: string;
  providerName: string;
  merchantName?: string;
  date: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
}

const TOAST_TITLE_INCOMPLETE_FIELDS = "Campos Incompletos";
const TOAST_TITLE_GEOLOCATION_UNSUPPORTED = "Geolocalización no Soportada";
const TOAST_TITLE_LOCATION_ERROR = "Error de Ubicación";

export default function HomePage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("taxi");
  const [taxiServiceType, setTaxiServiceType] = useState<'básico' | 'premium'>("básico");
  const [bookingType, setBookingType] = useState("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showLogoAnimation, setShowLogoAnimation] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [activeServiceTab, setActiveServiceTab] = useState("trips");

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | undefined>(undefined);
  const [deliveryOrderDetails, setDeliveryOrderDetails] = useState("");

  const [isServiceActive, setIsServiceActive] = useState(false);
  const [activeServiceInfo, setActiveServiceInfo] = useState<ActiveServiceInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressToastShownRef = useRef<{ '50': boolean; '90': boolean }>({ '50': false, '90': false });

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [serviceToRateInfo, setServiceToRateInfo] = useState<ActiveServiceInfo | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");

  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null);

  // Load merchants on component mount
  useEffect(() => {
    const loadMerchants = async () => {
      try {
        // Seed merchants if they don't exist
        await seedMerchants();
        
        // Load merchants
        const { data, error } = await getAllMerchants();
        if (data && !error) {
          setMerchants(data);
        } else {
          console.error("Error loading merchants:", error);
        }
      } catch (error) {
        console.error("Error loading merchants:", error);
      }
    };

    loadMerchants();
  }, []);

  useEffect(() => {
    setIsClient(true);
    const logoTimer = setTimeout(() => {
      setShowLogoAnimation(false);
    }, 3000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      clearTimeout(logoTimer);
    };
  }, []);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startSimulatedProgress = () => {
    setSimulatedProgress(0);
    progressToastShownRef.current = { '50': false, '90': false };
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setSimulatedProgress(prev => {
        const nextProgress = prev + 5;
        if (nextProgress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 100;
        }
        if (nextProgress >= 50 && !progressToastShownRef.current['50']) {
          toast({ title: "Actualización de Servicio", description: "Tu servicio está a mitad de camino." });
          progressToastShownRef.current['50'] = true;
        }
        if (nextProgress >= 90 && !progressToastShownRef.current['90']) {
          toast({ title: "Actualización de Servicio", description: "Tu proveedor está llegando a tu destino." });
          progressToastShownRef.current['90'] = true;
        }
        return nextProgress;
      });
    }, 2000);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: TOAST_TITLE_GEOLOCATION_UNSUPPORTED,
        description: "Tu navegador no soporta la geolocalización.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupLocation(`Ubicación actual obtenida (simulación)`);
        toast({
          title: "Ubicación Obtenida",
          description: "Se ha establecido tu ubicación actual como punto de recogida.",
        });
      },
      (error) => {
        let description = "Ocurrió un error al obtener tu ubicación.";
        if (error.code === error.PERMISSION_DENIED) {
          description = "No se pudo obtener tu ubicación porque el permiso fue denegado.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          description = "No se pudo determinar tu ubicación actual.";
        } else if (error.code === error.TIMEOUT) {
          description = "Se agotó el tiempo para obtener tu ubicación.";
        }
        toast({
          title: TOAST_TITLE_LOCATION_ERROR,
          description,
          variant: "destructive",
        });
      }
    );
  };

  const handleTripBooking = async () => {
    if (!user) {
      toast({ 
        title: "Autenticación Requerida", 
        description: "Debes iniciar sesión para reservar un viaje.", 
        variant: "destructive" 
      });
      return;
    }

    if (!pickupLocation || !destination) {
      toast({ 
        title: TOAST_TITLE_INCOMPLETE_FIELDS, 
        description: "Por favor, ingrese el origen y el destino.", 
        variant: "destructive" 
      });
      return;
    }

    console.log("Creando viaje en Supabase...");
    setEstimatedTime(null);
    toast({ title: "Creando Viaje", description: "Registrando tu solicitud de viaje...", duration: 2500 });

    try {
      // Create trip in Supabase
      const tripData = {
        customer_id: user.id,
        pickup_location: pickupLocation,
        destination: destination,
        vehicle_type: vehicleType as 'taxi' | 'moto-taxi',
        taxi_type: vehicleType === 'taxi' ? taxiServiceType : null,
        scheduled_time: bookingType === 'later' && scheduledDate 
          ? new Date(`${format(scheduledDate, 'yyyy-MM-dd')} ${scheduledTime}`).toISOString()
          : null,
        status: 'pending' as const
      };

      const { data: trip, error } = await createTrip(tripData);

      if (error) {
        console.error("Error creating trip:", error);
        toast({
          title: "Error al Crear Viaje",
          description: "No se pudo crear tu solicitud de viaje. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      if (trip) {
        toast({ 
          title: "¡Viaje Creado!", 
          description: "Tu solicitud ha sido registrada. Buscando conductor disponible...", 
          duration: 3000 
        });

        // Simulate finding a driver after 3 seconds
        setTimeout(() => {
          const providerType = vehicleType === 'taxi' ? 'Taxi' : 'Moto-Taxi';
          const providerName = vehicleType === 'taxi' ? 'Taxista Asignado' : 'Mototaxista Asignado';
          const serviceDetail = vehicleType === 'taxi' ? taxiServiceType : '';

          const serviceInfo: ActiveServiceInfo = {
            id: trip.id,
            type: providerType,
            providerName: providerName,
            vehicle: vehicleType,
            taxiType: vehicleType === 'taxi' ? taxiServiceType : undefined,
          };
          
          setActiveServiceInfo(serviceInfo);
          setChatMessages([
            { 
              id: `provider-start-${Date.now()}`, 
              sender: 'provider', 
              text: `¡Hola! Tu ${providerType.toLowerCase()} ${serviceDetail} está en camino.`.trim(), 
              timestamp: new Date() 
            }
          ]);
          setIsServiceActive(true);
          startSimulatedProgress();

          toast({
            title: "¡Conductor Encontrado!",
            description: `Tu ${providerType.toLowerCase()} ${serviceDetail} (${providerName}) ha sido asignado y está en camino.`,
            duration: 5000,
          });
        }, 3000);

        if (bookingType === "now") {
          const randomMinutes = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
          setEstimatedTime(`${randomMinutes} minutos`);
        }
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeliveryRequest = async () => {
    if (!user) {
      toast({ 
        title: "Autenticación Requerida", 
        description: "Debes iniciar sesión para solicitar una entrega.", 
        variant: "destructive" 
      });
      return;
    }

    if (!selectedMerchantId || !pickupLocation || !destination || !deliveryOrderDetails) {
      toast({ 
        title: TOAST_TITLE_INCOMPLETE_FIELDS, 
        description: "Por favor, selecciona un comercio, ingresa detalles del pedido, origen y destino.", 
        variant: "destructive" 
      });
      return;
    }

    console.log("Creando orden de entrega en Supabase...");
    const merchant = merchants.find(m => m.id === selectedMerchantId);
    toast({ 
      title: "Creando Orden", 
      description: `Registrando tu pedido de ${merchant?.name || 'comercio'}...`, 
      duration: 2500 
    });

    try {
      // Create delivery order in Supabase
      const orderData = {
        customer_id: user.id,
        merchant_id: selectedMerchantId,
        pickup_location: pickupLocation,
        delivery_location: destination,
        order_details: deliveryOrderDetails,
        status: 'pending' as const
      };

      const { data: order, error } = await createDeliveryOrder(orderData);

      if (error) {
        console.error("Error creating delivery order:", error);
        toast({
          title: "Error al Crear Orden",
          description: "No se pudo crear tu orden de entrega. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      if (order) {
        toast({ 
          title: "¡Orden Creada!", 
          description: "Tu pedido ha sido registrado. Buscando repartidor disponible...", 
          duration: 3000 
        });

        // Simulate finding a delivery person after 3 seconds
        setTimeout(() => {
          const serviceInfo: ActiveServiceInfo = {
            id: order.id,
            type: 'Entrega de Comercio',
            providerName: 'Repartidor Asignado',
            merchantName: merchant?.name || 'Comercio Desconocido',
          };
          
          setActiveServiceInfo(serviceInfo);
          setChatMessages([
            { 
              id: `provider-start-${Date.now()}`, 
              sender: 'provider', 
              text: `¡Hola! Estoy gestionando tu pedido de ${merchant?.name}. Estaré en camino pronto.`, 
              timestamp: new Date() 
            }
          ]);
          setIsServiceActive(true);
          startSimulatedProgress();

          toast({
            title: "¡Repartidor Asignado!",
            description: `Un repartidor ha sido asignado para tu pedido de ${merchant?.name}.`,
            duration: 5000,
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating delivery order:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: newMessage,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    setTimeout(() => {
      const providerResponse: ChatMessage = {
        id: `provider-${Date.now()}`,
        sender: 'provider',
        text: 'Entendido. Gracias por la información.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, providerResponse]);
    }, 1500);
  };

  const showReceipt = (serviceInfo: ActiveServiceInfo) => {
    const simulatedAmount = (Math.random() * (30 - 3) + 3).toFixed(2);
    const paymentLast4 = Math.floor(Math.random() * 9000) + 1000;

    setReceiptDetails({
      serviceType: serviceInfo.type + (serviceInfo.vehicle === 'taxi' && serviceInfo.taxiType ? ` ${serviceInfo.taxiType}` : ''),
      providerName: serviceInfo.providerName,
      merchantName: serviceInfo.merchantName,
      date: format(new Date(), "PPPp", { locale: es }),
      amount: `$${simulatedAmount} USD`,
      paymentMethod: `Tarjeta terminada en ${paymentLast4}`,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    });
    setShowRatingDialog(false);
    setShowReceiptDialog(true);
  };

  const handleEndService = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setSimulatedProgress(100);
    if (activeServiceInfo) {
      setServiceToRateInfo(activeServiceInfo);
    }
    setShowRatingDialog(true);
    toast({ title: "¡Servicio Finalizado!", description: "Gracias por usar LLEVA. Por favor, califica tu experiencia." });
  };

  const finalizeServiceUI = () => {
    setIsServiceActive(false);
    setActiveServiceInfo(null);
    setChatMessages([]);
    setBookingType("now");
    setActiveServiceTab("trips");

    setPickupLocation("");
    setDestination("");
    setSelectedMerchantId(undefined);
    setDeliveryOrderDetails("");
    setScheduledDate(undefined);
    setScheduledTime("12:00");
    setEstimatedTime(null);

    setShowRatingDialog(false);
    setCurrentRating(0);
    setCurrentFeedback("");
    setServiceToRateInfo(null);

    setShowReceiptDialog(false);
    setReceiptDetails(null);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setSimulatedProgress(0);
    progressToastShownRef.current = { '50': false, '90': false };

    toast({ title: "Listo para un nuevo servicio", description: "Puedes solicitar otro viaje o entrega cuando quieras.", duration: 4000 });
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!user || !serviceToRateInfo?.id) {
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación.",
        variant: "destructive",
      });
      return;
    }

    try {
      const ratingData = {
        user_id: user.id,
        rating: rating,
        feedback: feedback || null,
        // Add trip_id or delivery_order_id based on service type
        ...(serviceToRateInfo.type.includes('Entrega') 
          ? { delivery_order_id: serviceToRateInfo.id }
          : { trip_id: serviceToRateInfo.id }
        )
      };

      const { error } = await createRating(ratingData);

      if (error) {
        console.error("Error creating rating:", error);
        toast({
          title: "Error al Calificar",
          description: "No se pudo guardar tu calificación.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Gracias por tu Opinión!",
        description: "Tu calificación ha sido enviada.",
      });

      if (serviceToRateInfo) showReceipt(serviceToRateInfo);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    }
  };

  const handleSkipRating = () => {
    toast({
      title: "Calificación Omitida",
      description: "Puedes calificar tus servicios más tarde desde tu historial.",
      variant: "default"
    });

    if (serviceToRateInfo) {
      showReceipt(serviceToRateInfo);
    } else {
      finalizeServiceUI();
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {showLogoAnimation && (
        <motion.div
          key="logo-animation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center bg-background z-50"
        >
          <Image
            src="/LLEVA - WORDLOGO.png"
            alt="LLEVA - WORDLOGO"
            width={300}
            height={150}
            priority
            data-ai-hint="logo brand"
          />
        </motion.div>
      )}
      {!showLogoAnimation && (
        <motion.div
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="container mx-auto py-8 px-4"
        >
          {isServiceActive && activeServiceInfo ? (
            <div className="w-full max-w-2xl mx-auto">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Icons.messageSquare className="h-7 w-7 text-primary" />
                    Chat con {activeServiceInfo.providerName}
                  </CardTitle>
                  <CardDescription>
                    Servicio de {activeServiceInfo.type.toLowerCase()} en curso.
                    {activeServiceInfo.vehicle && ` Vehículo: ${activeServiceInfo.vehicle === 'taxi' ? `Taxi ${activeServiceInfo.taxiType}` : 'Moto-Taxi'}`}
                    {activeServiceInfo.merchantName && ` Comercio: ${activeServiceInfo.merchantName}`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-center text-foreground">Seguimiento en Tiempo Real</h3>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-4 overflow-hidden border shadow-inner">
                      <Image
                        src="https://placehold.co/600x300.png"
                        alt="Mapa de seguimiento en tiempo real"
                        width={600}
                        height={300}
                        className="object-cover w-full h-full"
                        data-ai-hint="map route"
                        priority
                      />
                    </div>
                    <Progress value={simulatedProgress} className="w-full h-3 rounded-full" />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {simulatedProgress < 100 ? `Progreso del servicio: ${simulatedProgress}%` : '¡Servicio casi finalizado!'}
                    </p>
                  </div>
                </CardContent>

                <CardContent className="pt-4">
                  <ScrollArea className="h-[250px] w-full rounded-md border p-4 mb-4 bg-muted/20" ref={chatAreaRef}>
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={cn("mb-3 flex flex-col", msg.sender === 'user' ? 'items-end' : 'items-start')}>
                        <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm shadow", msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground border rounded-bl-none')}>
                          <p>{msg.text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {format(msg.timestamp, 'HH:mm', { locale: es })}
                        </p>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Inicia la conversación.</p>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="text-base"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" aria-label="Enviar mensaje">
                      <Icons.send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="justify-center pt-6">
                  <Button variant="destructive" onClick={handleEndService} className="w-full md:w-auto">Terminar Servicio y Calificar</Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center">
              <Card className="shadow-xl w-full max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">Elige tu Servicio</CardTitle>
                  {user ? (
                    <CardDescription className="text-center">
                      ¡Hola {profile?.full_name || user.email}! ¿Qué servicio necesitas hoy?
                    </CardDescription>
                  ) : (
                    <CardDescription className="text-center">
                      <span className="text-orange-600">Debes iniciar sesión para usar nuestros servicios.</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs value={activeServiceTab} onValueChange={setActiveServiceTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="trips" className="flex items-center gap-2">
                        <Icons.car className="h-5 w-5" /> Viajes
                      </TabsTrigger>
                      <TabsTrigger value="deliveries" className="flex items-center gap-2">
                        <Icons.package className="h-5 w-5" /> Entregas
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trips" className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="pickup-trip">Lugar de Recogida</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="pickup-trip" 
                            placeholder="Ingresa lugar de recogida" 
                            value={pickupLocation} 
                            onChange={(e) => setPickupLocation(e.target.value)} 
                            className="flex-grow"
                            disabled={!user}
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleGetCurrentLocation} 
                            aria-label="Usar ubicación actual"
                            disabled={!user}
                          >
                            <Icons.locateFixed className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destination-trip">Destino</Label>
                        <Input 
                          id="destination-trip" 
                          placeholder="Ingresa destino" 
                          value={destination} 
                          onChange={(e) => setDestination(e.target.value)}
                          disabled={!user}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Vehículo</Label>
                        <Tabs value={vehicleType} onValueChange={setVehicleType} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="taxi" className="flex items-center gap-2" disabled={!user}>
                              <Icons.car className="h-5 w-5" /> Taxi
                            </TabsTrigger>
                            <TabsTrigger value="moto-taxi" className="flex items-center gap-2" disabled={!user}>
                              <Icons.motorcycle className="h-5 w-5" /> Moto-Taxi
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {vehicleType === 'taxi' && (
                        <div className="space-y-2">
                          <Label>Modalidad de Taxi</Label>
                          <Tabs value={taxiServiceType} onValueChange={(value) => setTaxiServiceType(value as 'básico' | 'premium')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="básico" className="flex items-center gap-2" disabled={!user}>
                                <Icons.car className="h-5 w-5" /> Básico
                              </TabsTrigger>
                              <TabsTrigger value="premium" className="flex items-center gap-2" disabled={!user}>
                                <Icons.sparkles className="h-5 w-5" /> Premium
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      )}

                      <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="now" disabled={!user}>Reservar Ahora</TabsTrigger>
                          <TabsTrigger value="later" disabled={!user}>Programar Después</TabsTrigger>
                        </TabsList>
                        <TabsContent value="later" className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="scheduledDate-trip">Fecha</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="scheduledDate-trip"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !scheduledDate && "text-muted-foreground"
                                  )}
                                  disabled={!user}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {scheduledDate ? format(scheduledDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={scheduledDate}
                                  onSelect={setScheduledDate}
                                  initialFocus
                                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scheduledTime-trip">Hora</Label>
                            <Input
                              id="scheduledTime-trip"
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full"
                              disabled={!user}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      {estimatedTime && bookingType === "now" && activeServiceTab === "trips" && (
                        <div className="text-center text-primary font-semibold p-3 bg-primary/10 rounded-md">
                          Llegada Estimada (antes de asignar): {estimatedTime}
                        </div>
                      )}
                      <Button 
                        className="w-full text-lg py-6" 
                        onClick={handleTripBooking}
                        disabled={!user}
                      >
                        {bookingType === "now" ? "Buscar Viaje Ahora" : "Programar Viaje"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="deliveries" className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="merchant-select">Comercio Afiliado</Label>
                        <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId} disabled={!user}>
                          <SelectTrigger id="merchant-select">
                            <SelectValue placeholder="Selecciona un comercio" />
                          </SelectTrigger>
                          <SelectContent>
                            {merchants.map(merchant => (
                              <SelectItem key={merchant.id} value={merchant.id}>
                                {merchant.name} ({merchant.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryOrderDetails">Detalles de tu pedido</Label>
                        <Textarea
                          id="deliveryOrderDetails"
                          placeholder="Ej: 1 Pizza grande de pepperoni, 2 Coca-Colas. O instrucciones especiales para el repartidor."
                          value={deliveryOrderDetails}
                          onChange={(e) => setDeliveryOrderDetails(e.target.value)}
                          rows={4}
                          disabled={!user}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pickup-delivery">Lugar de Recogida (Comercio/Punto)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="pickup-delivery" 
                            placeholder="Dirección del comercio o punto de recogida" 
                            value={pickupLocation} 
                            onChange={(e) => setPickupLocation(e.target.value)} 
                            className="flex-grow"
                            disabled={!user}
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleGetCurrentLocation} 
                            aria-label="Usar ubicación actual para recogida de entrega"
                            disabled={!user}
                          >
                            <Icons.locateFixed className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destination-delivery">Tu Dirección de Entrega</Label>
                        <Input 
                          id="destination-delivery" 
                          placeholder="Ingresa tu dirección" 
                          value={destination} 
                          onChange={(e) => setDestination(e.target.value)}
                          disabled={!user}
                        />
                      </div>
                      <Button 
                        className="w-full text-lg py-6" 
                        onClick={handleDeliveryRequest}
                        disabled={!user}
                      >
                        Solicitar Entrega de Comercio
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={showRatingDialog} onOpenChange={(isOpen) => { if (!isOpen && !showReceiptDialog) handleSkipRating(); }}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">Califica tu Servicio</DialogTitle>
                {serviceToRateInfo && (
                  <DialogDescription className="text-center pt-1">
                    ¿Cómo fue tu {serviceToRateInfo.type.toLowerCase()} con {serviceToRateInfo.providerName}
                    {serviceToRateInfo.merchantName ? ` (de ${serviceToRateInfo.merchantName})` : ''}?
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative">
                      <input
                        type="radio"
                        id={`rate-${star}`}
                        name="rating"
                        value={star}
                        checked={currentRating === star}
                        onChange={() => setCurrentRating(star)}
                        className="sr-only"
                        aria-label={`Calificar ${star} estrellas`}
                      />
                      <label
                        htmlFor={`rate-${star}`}
                        className={cn(
                          "cursor-pointer h-10 w-10 rounded-full p-0 inline-flex items-center justify-center",
                          currentRating >= star ? "text-yellow-400 hover:text-yellow-300" : "text-muted-foreground hover:text-yellow-400"
                        )}
                      >
                        <Icons.star
                          className={cn(
                            "h-7 w-7 text-current",
                            currentRating >= star && "fill-current text-yellow-400"
                          )}
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <Textarea
                  placeholder="Deja un comentario adicional (opcional)..."
                  value={currentFeedback}
                  onChange={(e) => setCurrentFeedback(e.target.value)}
                  rows={4}
                  className="text-base"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleSkipRating} className="w-full sm:w-auto">
                  Omitir
                </Button>
                <Button
                  onClick={() => handleRatingSubmit(currentRating, currentFeedback)}
                  disabled={currentRating === 0}
                  className="w-full sm:w-auto"
                >
                  Enviar Calificación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showReceiptDialog} onOpenChange={(isOpen) => { if (!isOpen) finalizeServiceUI(); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">Recibo de Servicio</DialogTitle>
              </DialogHeader>
              {receiptDetails && (
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Servicio:</span>
                    <span className="font-medium text-right">{receiptDetails.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proveedor:</span>
                    <span className="font-medium text-right">{receiptDetails.providerName}</span>
                  </div>
                  {receiptDetails.merchantName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comercio:</span>
                      <span className="font-medium text-right">{receiptDetails.merchantName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha y Hora:</span>
                    <span className="font-medium text-right">{receiptDetails.date}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Monto Total:</span>
                    <span className="font-semibold text-primary">{receiptDetails.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pago:</span>
                    <span className="font-medium text-right">{receiptDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Transacción:</span>
                    <span className="font-mono text-xs text-right">{receiptDetails.transactionId}</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => finalizeServiceUI()} className="w-full">Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
