import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AlertTriangle,
  AudioLines,
  BarChart3,
  Disc3,
  Flame,
  Heart,
  Headphones,
  LayoutDashboard,
  Library,
  LifeBuoy,
  ListMusic,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Music2,
  Pause,
  Play,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  Ticket,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "./cn";

export const icons = {
  alert: AlertTriangle,
  waveform: AudioLines,
  chart: BarChart3,
  disc: Disc3,
  flame: Flame,
  heart: Heart,
  headphones: Headphones,
  dashboard: LayoutDashboard,
  library: Library,
  support: LifeBuoy,
  waitlist: ListMusic,
  login: LogIn,
  logout: LogOut,
  mail: Mail,
  menu: Menu,
  music: Music2,
  pause: Pause,
  play: Play,
  search: Search,
  cart: ShoppingCart,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  store: Store,
  ticket: Ticket,
  upload: Upload,
  user: User,
  wallet: Wallet,
  close: X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
export type IconSize = "sm" | "md" | "lg" | "xl";

const px: Record<IconSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 32,
};

export function Icon({
  name,
  size = "md",
  className,
  strokeWidth = 2,
  ...props
}: {
  name: IconName;
  size?: IconSize;
  className?: string;
} & Omit<LucideProps, "size" | "name">) {
  const Cmp = icons[name];
  return (
    <Cmp
      size={px[size]}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    />
  );
}
