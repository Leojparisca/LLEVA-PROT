
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
// Removed Image from "next/image" as it's no longer used here if only wordmark is removed.
// If Icons.logo still uses next/image, it will be imported there.
import { Menu, X } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MockUser {
  name: string;
  avatarUrl: string;
  balance: number;
}

const mockUserData: MockUser = {
  name: "Alex Rider", 
  avatarUrl: "https://placehold.co/40x40.png", 
  balance: 75.50, 
};

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [loggedInUser, setLoggedInUser] = React.useState<MockUser | null>(null); 
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme) {
      setTheme(storedTheme);
    } else if (systemPrefersDark) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem('isSimulatedLoggedIn') === 'true') {
      setLoggedInUser(mockUserData);
    }
  }, [pathname]); 

  const handleLogout = () => {
    localStorage.removeItem('isSimulatedLoggedIn'); 
    setLoggedInUser(null);
  };
  
  React.useEffect(() => {
    if (isMobileMenuOpen) {
       setIsMobileMenuOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const Logo = () => (
    <Link href="/" className="flex items-center space-x-2 ml-4" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
      <Icons.logo className="h-8 w-8" /> 
      {/* The LLEVA wordmark Image component has been removed from here */}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 items-center">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-foreground/70 hover:text-foreground/90"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side of header (Auth, Theme Toggle, Mobile Menu) */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button (Desktop and Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9"
          >
            {theme === "light" ? <Icons.moon className="h-5 w-5" /> : <Icons.sun className="h-5 w-5" />}
          </Button>

          {/* Auth Buttons / User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {loggedInUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={loggedInUser.avatarUrl} alt={loggedInUser.name} data-ai-hint="user avatar" />
                      <AvatarFallback>{loggedInUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{loggedInUser.name}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Icons.wallet className="mr-2 h-4 w-4" />
                    Saldo: ${loggedInUser.balance.toFixed(2)}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {siteConfig.navItems.map((item) => ( 
                    <DropdownMenuItem key={`desktop-dd-${item.href}`} asChild>
                      <Link href={item.href}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Icons.user className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <Icons.logout className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Iniciar Sesión
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="h-9 w-9"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 bg-background border-b p-4 shadow-md animate-in slide-in-from-top-2 fade-in-20">
          <nav className="grid gap-2">
            {siteConfig.navItems.map((item) => (
              <Link
                key={`mobile-nav-${item.href}`}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary py-2 px-2 rounded-md",
                  pathname === item.href
                    ? "text-primary bg-primary/10"
                    : "text-foreground/80 hover:bg-muted"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-border/60" />
            {loggedInUser ? (
              <>
                 <div className="px-2 py-2">
                    <p className="text-sm font-medium leading-none">{loggedInUser.name}</p>
                    <p className="text-xs text-muted-foreground">Saldo: ${loggedInUser.balance.toFixed(2)}</p>
                 </div>
                 <Link href="/profile" 
                   className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start px-2 py-2 text-sm")}
                   onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icons.user className="mr-2 h-4 w-4" /> Perfil
                 </Link>
                <Button variant="outline" className="w-full justify-start px-2 py-2 text-sm" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                  <Icons.logout className="mr-2 h-4 w-4" /> Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" 
                  className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start px-2 py-2 text-sm")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link href="/register" 
                  className={cn(buttonVariants({ variant: "default" }), "w-full justify-start px-2 py-2 text-sm")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
