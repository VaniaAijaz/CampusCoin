import React from "react";
import {
  Utensils,
  Scissors,
  Car,
  BookOpen,
  GraduationCap,
  Building2,
  Home,
  ShoppingBag,
  HeartPulse,
  Dumbbell,
  Gamepad2,
  Film,
  Laptop,
  Smartphone,
  Zap,
  Wifi,
  Wallet,
  Coffee,
  Pizza,
  LayoutGrid,
  Tag,
  DollarSign,
  PiggyBank,
  Sparkles,
} from "lucide-react";

/**
 * Smart Keyword Matching Map for Dynamic Category Icons
 */
export function getCategoryIconComponent(categoryName = "") {
  const text = (categoryName || "").toLowerCase().trim();

  // Food & Dining
  if (
    text.includes("food") ||
    text.includes("burger") ||
    text.includes("meal") ||
    text.includes("dining") ||
    text.includes("eat") ||
    text.includes("restaurant") ||
    text.includes("lunch") ||
    text.includes("dinner") ||
    text.includes("breakfast") ||
    text.includes("snack") ||
    text.includes("canteen")
  ) {
    return Utensils;
  }
  if (text.includes("pizza")) {
    return Pizza;
  }
  if (text.includes("coffee") || text.includes("cafe") || text.includes("tea") || text.includes("chai")) {
    return Coffee;
  }

  // Personal Care & Salon
  if (
    text.includes("hair") ||
    text.includes("salon") ||
    text.includes("barber") ||
    text.includes("grooming") ||
    text.includes("cut")
  ) {
    return Scissors;
  }

  // Transit & Travel
  if (
    text.includes("transit") ||
    text.includes("transport") ||
    text.includes("bus") ||
    text.includes("uber") ||
    text.includes("careem") ||
    text.includes("indrive") ||
    text.includes("metro") ||
    text.includes("cab") ||
    text.includes("ride") ||
    text.includes("fuel") ||
    text.includes("petrol")
  ) {
    return Car;
  }

  // Education & Academics
  if (
    text.includes("book") ||
    text.includes("course") ||
    text.includes("study") ||
    text.includes("note") ||
    text.includes("pack") ||
    text.includes("stationery")
  ) {
    return BookOpen;
  }
  if (
    text.includes("tuition") ||
    text.includes("fee") ||
    text.includes("semester") ||
    text.includes("exam") ||
    text.includes("college") ||
    text.includes("university") ||
    text.includes("school") ||
    text.includes("aptech")
  ) {
    return GraduationCap;
  }

  // Housing & Living
  if (
    text.includes("rent") ||
    text.includes("hostel") ||
    text.includes("dorm") ||
    text.includes("room") ||
    text.includes("flat") ||
    text.includes("apartment")
  ) {
    return Home;
  }

  // Health, Fitness & Medical
  if (text.includes("gym") || text.includes("fitness") || text.includes("workout")) {
    return Dumbbell;
  }
  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("doctor") ||
    text.includes("pharmacy") ||
    text.includes("medicine")
  ) {
    return HeartPulse;
  }

  // Shopping & Retail
  if (
    text.includes("shopping") ||
    text.includes("cloth") ||
    text.includes("shoes") ||
    text.includes("mall") ||
    text.includes("store") ||
    text.includes("grocery")
  ) {
    return ShoppingBag;
  }

  // Entertainment & Gaming
  if (text.includes("game") || text.includes("gaming") || text.includes("playstation") || text.includes("xbox")) {
    return Gamepad2;
  }
  if (
    text.includes("entertainment") ||
    text.includes("movie") ||
    text.includes("cinema") ||
    text.includes("netflix") ||
    text.includes("film") ||
    text.includes("concert")
  ) {
    return Film;
  }

  // Technology & Devices
  if (text.includes("laptop") || text.includes("computer") || text.includes("tech") || text.includes("software")) {
    return Laptop;
  }
  if (text.includes("phone") || text.includes("mobile") || text.includes("recharge") || text.includes("data")) {
    return Smartphone;
  }

  // Utilities & Bills
  if (text.includes("wifi") || text.includes("internet") || text.includes("broadband")) {
    return Wifi;
  }
  if (text.includes("bill") || text.includes("utility") || text.includes("electric") || text.includes("power")) {
    return Zap;
  }

  // Income, Savings & Pocket Money
  if (
    text.includes("income") ||
    text.includes("salary") ||
    text.includes("allowance") ||
    text.includes("stipend") ||
    text.includes("freelance") ||
    text.includes("cash")
  ) {
    return Wallet;
  }
  if (text.includes("save") || text.includes("saving") || text.includes("piggy")) {
    return PiggyBank;
  }

  // Generic fallback for unmatched words as required by prompt
  return LayoutGrid;
}

/**
 * Returns React Element for the category name with smart fallback
 */
export function getCategoryIcon(categoryName = "", className = "w-4 h-4") {
  const IconComp = getCategoryIconComponent(categoryName);
  return <IconComp className={className} />;
}

export default getCategoryIcon;
