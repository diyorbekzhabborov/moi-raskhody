import React from 'react';
import {
  Utensils,
  Car,
  Home,
  GraduationCap,
  ShoppingBag,
  Wifi,
  Tv,
  Gamepad2,
  Shirt,
  HeartPulse,
  Gift,
  MoreHorizontal,
  Briefcase,
  Laptop,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  PiggyBank,
  Wallet,
  Coffee,
  Fuel,
  Plane,
  Film,
  Dumbbell,
  BookOpen,
  Smartphone,
  Music,
  ShoppingBasket,
  HelpCircle
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  Home,
  GraduationCap,
  ShoppingBag,
  Wifi,
  Tv,
  Gamepad2,
  Shirt,
  HeartPulse,
  Gift,
  MoreHorizontal,
  Briefcase,
  Laptop,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  PiggyBank,
  Wallet,
  Coffee,
  Fuel,
  Plane,
  Film,
  Dumbbell,
  BookOpen,
  Smartphone,
  Music,
  ShoppingBasket
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const CategoryIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} />;
};
