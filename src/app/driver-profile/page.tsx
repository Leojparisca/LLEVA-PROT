
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const venezuelanCities = ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "San Cristóbal", "Maturín", "Barcelona", "Cumaná", "Valle de la Pascua"];

const fileSchema = z.custom<FileList>((val) => val instanceof FileList, "Debes seleccionar un archivo")
  .refine((files) => files.length > 0, `El archivo es requerido.`)
  .refine((files) => files.length <= 1, `Solo puedes seleccionar un archivo.`)
  .refine((files) => files[0]?.size <= 5 * 1024 * 1024, `El archivo no debe exceder 5MB.`) // Max 5MB
  .refine(
    (files) => ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(files[0]?.type),
    "Formato de archivo no válido (se permiten JPG, PNG, WEBP, PDF)."
  );


const driverProfileSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre completo debe tener al menos 3 caracteres" }),
  city: z.string().min(1, { message: "La ciudad es requerida" }),
  age: z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? parseInt(val, 10) : val),
    z.number({ required_error: "La edad es requerida", invalid_type_error: "La edad debe ser un número" })
      .min(18, { message: "Debes tener al menos 18 años" })
      .max(120, { message: "Edad inválida" })
  ),
  idPhoto: fileSchema,
  licensePhoto: fileSchema,
  vehiclePhoto: fileSchema,
  vehicleType: z.enum(["carro", "camioneta", "moto"], { required_error: "Selecciona un tipo de vehículo" }),
  vehicleMake: z.string().min(2, { message: "La marca del vehículo es requerida" }),
  vehicleModel: z.string().min(1, { message: "El modelo/serie del vehículo es requerido" }),
  vehicleYear: z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? parseInt(val, 10) : val),
    z.number({ required_error: "El año del vehículo es requerido", invalid_type_error: "El año debe ser un número" })
      .min(1950, { message: "Año del vehículo inválido" })
      .max(new Date().getFullYear() + 1, { message: "Año del vehículo inválido" })
  ),
  vehicleSpecificType: z.string().optional(),
  vehicleDoors: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseInt(val, 10) : val)),
    z.number({ invalid_type_error: "Debe ser un número" }).min(2).max(5).optional()
  ),
}).superRefine((data, ctx) => {
  if (data.vehicleType === "carro" || data.vehicleType === "camioneta") {
    if (!data.vehicleSpecificType || data.vehicleSpecificType.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Especificar el tipo (ej: Sedán, SUV) es requerido para carros y camionetas.",
        path: ["vehicleSpecificType"],
      });
    }
    if (!data.vehicleDoors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número de puertas es requerido para carros y camionetas.",
        path: ["vehicleDoors"],
      });
    }
  }
});

type DriverProfileFormValues = z.infer<typeof driverProfileSchema>;

export default function DriverProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<DriverProfileFormValues>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      fullName: "",
      city: "",
      age: undefined, // Use undefined for number inputs to show placeholder
      vehicleType: undefined,
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: undefined,
      vehicleSpecificType: "",
      vehicleDoors: undefined,
    },
  });

  const watchedVehicleType = form.watch("vehicleType");

  function onSubmit(values: DriverProfileFormValues) {
    console.log("Driver profile submitted:", values);
    // Simulate file handling
    const fileData = {
        idPhotoName: values.idPhoto[0]?.name,
        licensePhotoName: values.licensePhoto[0]?.name,
        vehiclePhotoName: values.vehiclePhoto[0]?.name,
    };
    console.log("Simulated file info:", fileData);

    toast({
      title: "Perfil de Conductor Enviado",
      description: "Tu información ha sido enviada para revisión. Serás redirigido.",
      duration: 5000,
    });
    router.push("/"); 
  }

  if (!isClient) return null;

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl shadow-xl rounded-lg">
        <CardHeader className="text-center pt-8">
          <Icons.user className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl font-bold">Completa tu Perfil de Conductor</CardTitle>
          <CardDescription>
            Necesitamos algunos detalles adicionales para activar tu cuenta de conductor.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="text-center mb-6">
                <Avatar className="w-24 h-24 mx-auto mb-2 ring-2 ring-primary ring-offset-background ring-offset-2">
                  {/* Placeholder for actual image upload/preview */}
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">(Podrás agregar tu foto de perfil más adelante)</p>
              </div>

              <Separator />
              <h3 className="text-xl font-semibold pt-4 pb-2 text-foreground">Información Personal</h3>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl><Input placeholder="Ej: Ana Sofía Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad de Residencia</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu ciudad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venezuelanCities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad</FormLabel>
                      <FormControl><Input type="number" placeholder="Debes ser mayor de 18" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              <h3 className="text-xl font-semibold pt-4 pb-2 text-foreground">Documentación</h3>

              <FormField
                control={form.control}
                name="idPhoto"
                render={({ field: { onChange, onBlur, name, value, ref } }) => (
                  <FormItem>
                    <FormLabel>Foto de la Cédula ( legible, PDF o Imagen)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input
                          type="file"
                          id="idPhoto"
                          className="hidden"
                          onChange={(e) => onChange(e.target.files)}
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                          accept="image/*,.pdf"
                        />
                        <Label
                          htmlFor="idPhoto"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "cursor-pointer w-full sm:w-auto flex items-center justify-center"
                          )}
                        >
                          <Icons.uploadCloud className="mr-2 h-4 w-4" />
                          Seleccionar Archivo
                        </Label>
                        {value?.[0] && (
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {value[0].name}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="licensePhoto"
                render={({ field: { onChange, onBlur, name, value, ref } }) => (
                  <FormItem>
                    <FormLabel>Foto de la Licencia de Conducir (vigente, legible, PDF o Imagen)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input
                          type="file"
                          id="licensePhoto"
                          className="hidden"
                          onChange={(e) => onChange(e.target.files)}
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                          accept="image/*,.pdf"
                        />
                        <Label
                          htmlFor="licensePhoto"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "cursor-pointer w-full sm:w-auto flex items-center justify-center"
                          )}
                        >
                          <Icons.uploadCloud className="mr-2 h-4 w-4" />
                          Seleccionar Archivo
                        </Label>
                        {value?.[0] && (
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {value[0].name}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <h3 className="text-xl font-semibold pt-4 pb-2 text-foreground">Información del Vehículo</h3>
              
              <FormField
                control={form.control}
                name="vehiclePhoto"
                render={({ field: { onChange, onBlur, name, value, ref } }) => (
                  <FormItem>
                    <FormLabel>Foto del Vehículo (clara y mostrando la placa, PDF o Imagen)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input
                          type="file"
                          id="vehiclePhoto"
                          className="hidden"
                          onChange={(e) => onChange(e.target.files)}
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                          accept="image/*,.pdf"
                        />
                        <Label
                          htmlFor="vehiclePhoto"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "cursor-pointer w-full sm:w-auto flex items-center justify-center"
                          )}
                        >
                          <Icons.uploadCloud className="mr-2 h-4 w-4" />
                          Seleccionar Archivo
                        </Label>
                        {value?.[0] && (
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {value[0].name}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vehículo Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carro">Carro</SelectItem>
                        <SelectItem value="camioneta">Camioneta</SelectItem>
                        <SelectItem value="moto">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl><Input placeholder="Ej: Toyota" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo / Serie</FormLabel>
                      <FormControl><Input placeholder="Ej: Corolla / Bera SBR" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <FormControl><Input type="number" placeholder="Ej: 2020" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(watchedVehicleType === "carro" || watchedVehicleType === "camioneta") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleSpecificType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especificar Tipo (Sedán, SUV, Hatchback, etc.)</FormLabel>
                        <FormControl><Input placeholder="Ej: Sedán" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleDoors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Puertas</FormLabel>
                        <FormControl><Input type="number" placeholder="Ej: 4" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full text-lg py-6 mt-4" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar Registro de Conductor"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
