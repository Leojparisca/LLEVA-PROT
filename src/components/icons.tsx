
import type { LucideProps } from 'lucide-react';
import Image from 'next/image';
import {
  Car,
  Bike,
  User,
  CreditCard,
  Settings,
  HelpCircle,
  LogIn,
  LogOut,
  ChevronRight,
  MapPin,
  CalendarDays,
  Clock,
  Package,
  MessageSquare,
  Send,
  Store,
  Sparkles,
  Wallet,
  UploadCloud,
  Sun,
  Moon,
  Star,
  Shield,
  Users,
  Truck,
  LocateFixed, // Added icon
} from 'lucide-react';

// Define the LLEVA logo as a component using next/image
// It assumes the image is saved as /public/LLEVA - ICONLOGO.png
const LlevaImageLogo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
  <Image
    src="/LLEVA - ICONLOGO.png"
    alt="Lleva Logo"
    width={32} // Default width, can be overridden by className
    height={32} // Default height, can be overridden by className
    priority // Optional: if the logo is critical for LCP
    {...props} // Allows passing className, style, etc.
  />
);


export const Icons = {
  car: Car,
  motorcycle: Bike,
  user: User,
  creditCard: CreditCard,
  settings: Settings,
  helpCircle: HelpCircle,
  login: LogIn,
  logout: LogOut,
  chevronRight: ChevronRight,
  mapPin: MapPin,
  calendarDays: CalendarDays,
  clock: Clock,
  package: Package,
  messageSquare: MessageSquare,
  send: Send,
  store: Store,
  sparkles: Sparkles,
  wallet: Wallet,
  uploadCloud: UploadCloud,
  sun: Sun,
  moon: Moon,
  star: Star,
  shield: Shield,
  users: Users,
  truck: Truck,
  logo: LlevaImageLogo,
  locateFixed: LocateFixed, // Added icon
};
