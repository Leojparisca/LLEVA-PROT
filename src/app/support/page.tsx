"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

const supportSchema = z.object({
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres" }),
  email: z.string().email({ message: "Por favor, ingrese una dirección de email válida" }),
  message: z.string().min(20, { message: "El mensaje debe tener al menos 20 caracteres" }),
});

type SupportFormValues = z.infer<typeof supportSchema>;

const faqs = [
  {
    id: "faq1",
    question: "¿Cómo reservo un viaje?",
    answer: "Puedes reservar un viaje a través de nuestra app ingresando tus ubicaciones de recogida y destino, seleccionando tu tipo de vehículo preferido y confirmando tu reserva. Puedes elegir reservar para ahora o programar para más tarde."
  },
  {
    id: "faq2",
    question: "¿Qué métodos de pago se aceptan?",
    answer: "Aceptamos varios métodos de pago, incluyendo tarjetas de crédito/débito y billeteras digitales. Puedes administrar tus métodos de pago en la sección de Perfil."
  },
  {
    id: "faq3",
    question: "¿Cómo se calcula la tarifa?",
    answer: "Las tarifas se calculan en función de la distancia, el tiempo, el tipo de vehículo y la demanda actual. Verás una tarifa estimada antes de confirmar tu reserva."
  },
  {
    id: "faq4",
    question: "¿Puedo cancelar un viaje?",
    answer: "Sí, puedes cancelar un viaje. Dependiendo del momento de la cancelación y el estado del conductor, podría aplicarse una tarifa de cancelación. Por favor, consulta nuestra política de cancelación para más detalles."
  }
];

export default function SupportPage() {
  const { toast } = useToast();
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: SupportFormValues) {
    console.log("Support request submitted:", values);
    // TODO: Implement actual support request submission
    toast({
      title: "¡Mensaje Enviado!",
      description: "Tu solicitud de soporte ha sido enviada. Te responderemos pronto.",
    });
    form.reset();
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <Icons.helpCircle className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Centro de Soporte</h1>
        <p className="text-lg text-muted-foreground mt-2">Estamos aquí para ayudarte. Encuentra respuestas o contáctanos directamente.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <Card className="shadow-xl rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Contactar a Soporte</CardTitle>
            <CardDescription>¿Tienes un problema o una pregunta? Completa el formulario a continuación.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="ej: Problema con un viaje reciente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Describe tu problema o consulta en detalle..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-lg py-6">
                  Enviar Mensaje
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6 pt-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground mt-1">Encuentra respuestas a preguntas comunes a continuación.</p>
          </div>
          <Accordion type="single" collapsible className="w-full rounded-lg border">
            {faqs.map((faq, index) => (
              <AccordionItem value={faq.id} key={faq.id} className={cn(index === faqs.length - 1 && "border-b-0")}>
                <AccordionTrigger className="text-base hover:no-underline px-6 py-4 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm px-6 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
