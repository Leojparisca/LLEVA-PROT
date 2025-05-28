export const siteConfig = {
  name: "LLEVA",
  description: "Servicio de transporte confiable y moderno. Reserva taxis y moto-taxis con facilidad.",
  url: "https://lleva.example.com", // Replace with actual URL if available
  ogImage: "https://lleva.example.com/og.jpg", // Replace with actual OG image
  links: {
    // Add relevant links if any, e.g., social media
    // twitter: "https://twitter.com/lleva_app",
    // github: "https://github.com/your-repo/lleva", 
  },
  navItems: [
    { label: "Reservar Viaje", href: "/" },
    { label: "Perfil", href: "/profile" },
    { label: "Soporte", href: "/support" },
  ],
};

export type SiteConfig = typeof siteConfig;
