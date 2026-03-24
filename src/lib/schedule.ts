// ── Stripe ────────────────────────────────────────────────────────────────────
export const STRIPE_PRICES = {
  SINGLE_SESSION: "price_1T6h4W4itG4QbkUPrRwLfZy7",
  PACK_10: "price_1T6h4m4itG4QbkUPjAeYQelu",
  PACK_5: "price_1T6h524itG4QbkUPtSq1Y3Hh",
} as const;

export const isReformer = (name: string) => name.toLowerCase().includes("reformer");

// ── Class types & colors ──────────────────────────────────────────────────────
export const CLASS_TYPES = [
  "Reformer",
  "Mat Pilates",
  "Power Yoga",
  "Cardio Zumba",
  "Post-natal",
  "Maman & Bébé",
  "Barre Fit",
  "Yoga Flow",
] as const;

export type ClassType = (typeof CLASS_TYPES)[number];

/** Tailwind-safe color classes per type – used on both public planning & admin */
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Reformer: { bg: "bg-[#B8634A]/20", text: "text-[#B8634A]", border: "border-[#B8634A]/40", dot: "#B8634A" },
  "Mat Pilates": { bg: "bg-[#6B8F9E]/20", text: "text-[#6B8F9E]", border: "border-[#6B8F9E]/40", dot: "#6B8F9E" },
  "Power Yoga": { bg: "bg-[#4E9E7A]/20", text: "text-[#4E9E7A]", border: "border-[#4E9E7A]/40", dot: "#4E9E7A" },
  "Cardio Zumba": { bg: "bg-[#C46E8A]/20", text: "text-[#C46E8A]", border: "border-[#C46E8A]/40", dot: "#C46E8A" },
  "Post-natal": { bg: "bg-[#9B7EBD]/20", text: "text-[#9B7EBD]", border: "border-[#9B7EBD]/40", dot: "#9B7EBD" },
  "Maman & Bébé": { bg: "bg-[#D4896A]/20", text: "text-[#D4896A]", border: "border-[#D4896A]/40", dot: "#D4896A" },
  "Barre Fit": { bg: "bg-[#D4A853]/20", text: "text-[#D4A853]", border: "border-[#D4A853]/40", dot: "#D4A853" },
  "Yoga Flow": { bg: "bg-[#5E9E8E]/20", text: "text-[#5E9E8E]", border: "border-[#5E9E8E]/40", dot: "#5E9E8E" },
};

export const getTypeColor = (type: string) =>
  TYPE_COLORS[type] ?? { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border", dot: "#888" };

// ── Default coaches (pre-selected in dropdowns) ───────────────────────────────
export const DEFAULT_COACHES = ["Mayssae", "Yasmine", "Andy", "Narjiss"];

// ── Standard weekly template ──────────────────────────────────────────────────
// day: 1=Lundi … 6=Samedi, 0=Dimanche
export interface WeekTemplate {
  day: number;
  time: string;
  title: string;
  type: string;
  instructor: string;
  duration: number;
  price: number;
  capacity: number;
  level: string;
}

export const STANDARD_WEEK: WeekTemplate[] = [
  // ── Lundi ──
  {
    day: 1,
    time: "10:00",
    title: "Mat Pilates",
    type: "Mat Pilates",
    instructor: "Mayssae",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 1,
    time: "11:00",
    title: "Post-natal",
    type: "Post-natal",
    instructor: "Mayssae",
    duration: 60,
    price: 300,
    capacity: 8,
    level: "Tous niveaux",
  },
  {
    day: 1,
    time: "18:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 1,
    time: "19:00",
    title: "Reformer + Springwall",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  // ── Mardi ──
  {
    day: 2,
    time: "10:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 2,
    time: "11:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 2,
    time: "18:00",
    title: "Barre Fit",
    type: "Barre Fit",
    instructor: "Mayssae",
    duration: 55,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 2,
    time: "19:00",
    title: "Pilates Flow",
    type: "Mat Pilates",
    instructor: "Mayssae",
    duration: 55,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  // ── Mercredi ──
  {
    day: 3,
    time: "11:00",
    title: "Pilates Maman & Bébé",
    type: "Maman & Bébé",
    instructor: "Mayssae",
    duration: 60,
    price: 300,
    capacity: 8,
    level: "Tous niveaux",
  },
  {
    day: 3,
    time: "18:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 3,
    time: "19:00",
    title: "Reformer Jumpboard",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Intermédiaire",
  },
  // ── Jeudi ──
  {
    day: 4,
    time: "10:00",
    title: "Power Yoga",
    type: "Power Yoga",
    instructor: "Yasmine",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 4,
    time: "12:30",
    title: "Mat Pilates",
    type: "Mat Pilates",
    instructor: "Mayssae",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 4,
    time: "18:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 4,
    time: "19:00",
    title: "Reformer + Springwall",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  // ── Vendredi ──
  {
    day: 5,
    time: "10:00",
    title: "Power Yoga",
    type: "Power Yoga",
    instructor: "Narjiss",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 5,
    time: "11:00",
    title: "Post-natal",
    type: "Post-natal",
    instructor: "Mayssae",
    duration: 60,
    price: 300,
    capacity: 8,
    level: "Tous niveaux",
  },
  {
    day: 5,
    time: "18:00",
    title: "Cardio Zumba",
    type: "Cardio Zumba",
    instructor: "Mayssae",
    duration: 55,
    price: 280,
    capacity: 15,
    level: "Tous niveaux",
  },
  {
    day: 5,
    time: "19:00",
    title: "Yoga Slow Flow",
    type: "Yoga Flow",
    instructor: "Narjiss",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  // ── Samedi ──
  {
    day: 6,
    time: "09:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 6,
    time: "10:00",
    title: "Power Yoga",
    type: "Power Yoga",
    instructor: "Yasmine",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 6,
    time: "11:00",
    title: "Jumpboard Reformer",
    type: "Reformer",
    instructor: "Yasmine",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Intermédiaire",
  },
  {
    day: 6,
    time: "16:00",
    title: "Cardio Zumba",
    type: "Cardio Zumba",
    instructor: "Mayssae",
    duration: 55,
    price: 280,
    capacity: 15,
    level: "Tous niveaux",
  },
  {
    day: 6,
    time: "17:00",
    title: "Power Yoga",
    type: "Power Yoga",
    instructor: "Yasmine",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
  // ── Dimanche ──
  {
    day: 0,
    time: "10:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 0,
    time: "11:00",
    title: "Reformer Signature",
    type: "Reformer",
    instructor: "Andy",
    duration: 55,
    price: 350,
    capacity: 13,
    level: "Tous niveaux",
  },
  {
    day: 0,
    time: "17:00",
    title: "Power Yoga",
    type: "Power Yoga",
    instructor: "Yasmine",
    duration: 60,
    price: 300,
    capacity: 13,
    level: "Tous niveaux",
  },
];
