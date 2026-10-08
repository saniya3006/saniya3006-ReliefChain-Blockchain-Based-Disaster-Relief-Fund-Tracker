import { Utensils, Pill, Home, Truck, Package, Waves, Mountain, Wind, Flame, LifeBuoy } from "lucide-react";

// Order MUST match the Category enum in ReliefChain.sol
export const CATEGORIES = [
  { key: "Food", label: "Food", icon: Utensils, color: "#2a78d6", bg: "bg-blue-50", text: "text-blue-700" },
  { key: "Medicine", label: "Medicine", icon: Pill, color: "#eb6834", bg: "bg-orange-50", text: "text-orange-700" },
  { key: "Shelter", label: "Shelter", icon: Home, color: "#1baf7a", bg: "bg-emerald-50", text: "text-emerald-700" },
  { key: "Transportation", label: "Transport", icon: Truck, color: "#eda100", bg: "bg-amber-50", text: "text-amber-700" },
  { key: "Other", label: "Other", icon: Package, color: "#e87ba4", bg: "bg-pink-50", text: "text-pink-700" },
];
export const categoryInfo = (key) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4];

export const DISASTER_TYPES = [
  { key: "Flood", icon: Waves, image: "/images/flood.svg" },
  { key: "Earthquake", icon: Mountain, image: "/images/earthquake.svg" },
  { key: "Cyclone", icon: Wind, image: "/images/cyclone.svg" },
  { key: "Fire", icon: Flame, image: "/images/fire.svg" },
  { key: "Other", icon: LifeBuoy, image: "/images/other.svg" },
];
export const disasterInfo = (key) => DISASTER_TYPES.find((d) => d.key === key) ?? DISASTER_TYPES[4];

// Local cover images (stored in frontend/public/images, NOT on the blockchain)
export const COVER_IMAGES = [
  { label: "Flood", url: "/images/flood.svg" },
  { label: "Flood (river)", url: "/images/flood2.svg" },
  { label: "Earthquake", url: "/images/earthquake.svg" },
  { label: "Cyclone", url: "/images/cyclone.svg" },
  { label: "Fire", url: "/images/fire.svg" },
  { label: "General relief", url: "/images/other.svg" },
];

export const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000];
