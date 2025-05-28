
"use client";

import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image'; // Import next/image
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'provider';
  text: string;
  timestamp: Date;
}

interface ActiveServiceInfo {
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
  image: string;
  dataAiHint: string;
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

const mockMerchants: Merchant[] = [
  { id: 'm1', name: 'Restaurante El Buen Sabor', category: 'Comida', image: 'https://placehold.co/100x100.png', dataAiHint: 'restaurant food' },
  { id: 'm2', name: 'Farmacia La Saludable', category: 'Farmacia', image: 'https://placehold.co/100x100.png', dataAiHint: 'pharmacy medicine' },
  { id: 'm3', name: 'Supermercado Todo Fresco', category: 'Supermercado', image: 'https://placehold.co/100x100.png', dataAiHint: 'supermarket groceries' },
  { id: 'm4', name: 'Tienda de Regalos Detallitos', category: 'Regalos', image: 'https://placehold.co/100x100.png', dataAiHint: 'gift shop' },
];

export default function HomePage() {
  const { toast } = useToast();
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
        // const { latitude, longitude } = position.coords; // Uncomment if using actual geocoding
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


  const handleTripBooking = () => {
    if (!pickupLocation || !destination) {
      toast({ title: TOAST_TITLE_INCOMPLETE_FIELDS, description: "Por favor, ingrese el origen y el destino.", variant: "destructive" });
      return;
    }
    console.log("Buscando proveedor para viaje...");
    setEstimatedTime(null);
    toast({ title: "Buscando Conductor", description: "Estamos buscando el conductor más cercano para ti...", duration: 2500 });

    setTimeout(() => {
      const providerType = vehicleType === 'taxi' ? 'Taxi' : 'Moto-Taxi';
      const providerName = vehicleType === 'taxi' ? 'Taxista Asignado' : 'Mototaxista Asignado';
      const serviceDetail = vehicleType === 'taxi' ? taxiServiceType : '';

      const serviceInfo: ActiveServiceInfo = {
        type: providerType,
        providerName: providerName,
        vehicle: vehicleType,
        taxiType: vehicleType === 'taxi' ? (taxiServiceType === 'básico' ? 'básico' : 'premium') : undefined,
      };
      setActiveServiceInfo(serviceInfo);
      setChatMessages([
        { id: `provider-start-${Date.now()}`, sender: 'provider', text: `¡Hola! Tu ${providerType.toLowerCase()} ${serviceDetail} está en camino.`.trim(), timestamp: new Date() }
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

    console.log("Reserva de viaje (pre-asignación):", {
      pickupLocation,
      destination,
      vehicleType,
      taxiServiceType: vehicleType === 'taxi' ? taxiServiceType : undefined,
      bookingType,
      scheduledDate: bookingType === 'later' ? scheduledDate : undefined,
      scheduledTime: bookingType === 'later' ? scheduledTime : undefined,
    });
  };

  const handleDeliveryRequest = () => {
    if (!selectedMerchantId || !pickupLocation || !destination || !deliveryOrderDetails) {
      toast({ title: TOAST_TITLE_INCOMPLETE_FIELDS, description: "Por favor, selecciona un comercio, ingresa detalles del pedido, origen y destino.", variant: "destructive" });
      return;
    }
    console.log("Buscando repartidor para entrega de comercio...");
    const merchant = mockMerchants.find(m => m.id === selectedMerchantId);
    toast({ title: "Buscando Repartidor", description: `Estamos buscando un repartidor para tu pedido de ${merchant?.name || 'comercio'}...`, duration: 2500 });


    setTimeout(() => {
      const serviceInfo: ActiveServiceInfo = {
        type: 'Entrega de Comercio',
        providerName: 'Repartidor Asignado',
        merchantName: merchant?.name || 'Comercio Desconocido',
      };
      setActiveServiceInfo(serviceInfo);
      setChatMessages([
        { id: `provider-start-${Date.now()}`, sender: 'provider', text: `¡Hola! Estoy gestionando tu pedido de ${merchant?.name}. Estaré en camino pronto.`, timestamp: new Date() }
      ]);
      setIsServiceActive(true);
      startSimulatedProgress();

      toast({
        title: "¡Repartidor Asignado!",
        description: `Un repartidor ha sido asignado para tu pedido de ${merchant?.name}.`,
        duration: 5000,
      });
    }, 3000);

    console.log("Solicitud de entrega de comercio (pre-asignación):", {
      merchantId: selectedMerchantId,
      orderDetails: deliveryOrderDetails,
      pickupLocation,
      destination,
    });
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

    toast({ title: "Listo para un nuevo servicio", description: "Puedes solicitar otro viaje o entrega cuando quieras.", duration: 4000});
  };

  const handleRatingSubmit = (rating: number, feedback: string) => {
    console.log("Calificación Enviada:", {
      rating,
      feedback,
      service: serviceToRateInfo
    });
    toast({
      title: "¡Gracias por tu Opinión!",
      description: "Tu calificación ha sido enviada.",
    });

    if (serviceToRateInfo) showReceipt(serviceToRateInfo);
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
                        <Input id="pickup-trip" placeholder="Ingresa lugar de recogida" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="flex-grow"/>
                        <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} aria-label="Usar ubicación actual">
                          <Icons.locateFixed className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination-trip">Destino</Label>
                      <Input id="destination-trip" placeholder="Ingresa destino" value={destination} onChange={(e) => setDestination(e.target.value)}/>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Vehículo</Label>
                      <Tabs value={vehicleType} onValueChange={setVehicleType} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="taxi" className="flex items-center gap-2">
                            <Icons.car className="h-5 w-5" /> Taxi
                          </TabsTrigger>
                          <TabsTrigger value="moto-taxi" className="flex items-center gap-2">
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
                            <TabsTrigger value="básico" className="flex items-center gap-2">
                              <Icons.car className="h-5 w-5" /> Básico
                            </TabsTrigger>
                            <TabsTrigger value="premium" className="flex items-center gap-2">
                              <Icons.sparkles className="h-5 w-5" /> Premium
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    )}

                    <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="now">Reservar Ahora</TabsTrigger>
                        <TabsTrigger value="later">Programar Después</TabsTrigger>
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
                                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) }
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
                            />
                         </div>
                      </TabsContent>
                    </Tabs>

                    {estimatedTime && bookingType === "now" && activeServiceTab === "trips" && (
                      <div className="text-center text-primary font-semibold p-3 bg-primary/10 rounded-md">
                        Llegada Estimada (antes de asignar): {estimatedTime}
                      </div>
                    )}
                    <Button className="w-full text-lg py-6" onClick={handleTripBooking}>
                      {bookingType === "now" ? "Buscar Viaje Ahora" : "Programar Viaje"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="deliveries" className="mt-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="merchant-select">Comercio Afiliado</Label>
                      <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                        <SelectTrigger id="merchant-select">
                          <SelectValue placeholder="Selecciona un comercio" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockMerchants.map(merchant => (
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pickup-delivery">Lugar de Recogida (Comercio/Punto)</Label>
                       <div className="flex items-center gap-2">
                          <Input id="pickup-delivery" placeholder="Dirección del comercio o punto de recogida" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="flex-grow"/>
                          <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} aria-label="Usar ubicación actual para recogida de entrega">
                             <Icons.locateFixed className="h-5 w-5" />
                          </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination-delivery">Tu Dirección de Entrega</Label>
                      <Input id="destination-delivery" placeholder="Ingresa tu dirección" value={destination} onChange={(e) => setDestination(e.target.value)}/>
                    </div>
                    <Button className="w-full text-lg py-6" onClick={handleDeliveryRequest}>
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
