import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["DM Sans", "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // EVOLV brand palette
        ivory: "hsl(var(--ivory))",
        cream: "hsl(var(--cream))",
        stone: {
          DEFAULT: "hsl(var(--stone))",
          light: "hsl(var(--stone-light))",
          dark: "hsl(var(--stone-dark))",
        },
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          deep: "hsl(var(--charcoal-deep))",
          mid: "hsl(var(--charcoal-mid))",
        },
        onyx: "hsl(var(--onyx))",
        pearl: "hsl(var(--pearl))",
        taupe: "hsl(var(--taupe))",
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        "warm-white": "hsl(var(--warm-white))",
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
        },
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "reveal-text": {
          "0%": { opacity: "0", letterSpacing: "0.3em" },
          "100%": { opacity: "1", letterSpacing: "0.12em" },
        },
        "line-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        "shimmer-sweep": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scale-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.015)" },
        },
        "divider-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "hero-studio-reveal": {
          "0%": { opacity: "0", letterSpacing: "0.4em" },
          "100%": { opacity: "1", letterSpacing: "0.12em" },
        },
        "scroll-indicator": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "40%": { transform: "scaleY(1)", transformOrigin: "top" },
          "60%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        "card-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 2%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(2%, -1%)" },
          "50%": { transform: "translate(-3%, 2%)" },
          "60%": { transform: "translate(1%, -3%)" },
          "70%": { transform: "translate(-2%, 1%)" },
          "80%": { transform: "translate(3%, -2%)" },
          "90%": { transform: "translate(-1%, 3%)" },
        },
        "logo-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 0px rgba(201,168,124,0))" },
          "50%": { filter: "drop-shadow(0 0 12px rgba(201,168,124,0.3))" },
        },
        "next-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,168,124,0.3)" },
          "50%": { boxShadow: "0 0 0 8px rgba(201,168,124,0)" },
        },
        "blink-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        "cursor-shake": {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "25%": { transform: "translate(-50%, -50%) rotate(5deg) scale(1.05)" },
          "50%": { transform: "translate(-50%, -50%) rotate(-4deg)" },
          "75%": { transform: "translate(-50%, -50%) rotate(3deg) scale(0.97)" },
          "100%": { transform: "translate(-50%, -50%) rotate(0deg)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "ring-breathe": {
          "0%, 100%": { strokeOpacity: "0.3" },
          "50%": { strokeOpacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.8s cubic-bezier(0.16,1,0.3,1)",
        "pulse-soft": "pulse-soft 5s ease-in-out infinite",
        "reveal-text": "reveal-text 1.2s ease-out forwards",
        "line-grow": "line-grow 0.8s ease-out forwards",
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 3s linear infinite",
        "scale-breathe": "scale-breathe 7s ease-in-out infinite",
        "divider-spin": "divider-spin 20s linear infinite",
        "hero-studio-reveal": "hero-studio-reveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scroll-indicator": "scroll-indicator 2.4s ease-in-out infinite",
        "card-float": "card-float 5s ease-in-out infinite",
        "grain-shift": "grain-shift 0.4s steps(1) infinite",
        "logo-glow": "logo-glow 4s ease-in-out infinite",
        "next-pulse": "next-pulse 2s ease-in-out infinite",
        "blink-dot": "blink-dot 1.5s ease-in-out infinite",
        "cursor-shake": "cursor-shake 0.3s ease-in-out infinite",
        orbit: "orbit 12s linear infinite",
        "ring-breathe": "ring-breathe 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
