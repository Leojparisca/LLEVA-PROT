
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - LLEVA",
  description: "Panel de Administración de LLEVA",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      {/* Este es un layout simple específico para el área de administración */}
      {/* Podrías agregar un encabezado o barra lateral de admin aquí si es necesario */}
      {children}
    </div>
  );
}
