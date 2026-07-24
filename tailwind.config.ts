import type { Config } from "tailwindcss";

// Paleta propia del proyecto:
// - "brand" (teal profundo): color de marca del policlínico, transmite salud + control.
// - "ingreso" / "egreso" / "alerta": colores semánticos fijos para dinero en TODA la app,
//   así el usuario aprende de un vistazo "verde = entra, rojo = sale, ámbar = atención".
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf6",
          100: "#d5f2e8",
          200: "#ade4d1",
          300: "#79ceb4",
          400: "#48b295",
          500: "#28967b",
          600: "#1c7a64", // primario
          700: "#186252",
          800: "#164e43",
          900: "#0f342e",
        },
        ingreso: { DEFAULT: "#16a34a", bg: "#eafaf0" },
        egreso: { DEFAULT: "#dc2626", bg: "#fdecec" },
        alerta: { DEFAULT: "#d97706", bg: "#fef3e2" },
        ink: "#10231f",
        surface: "#f6f5f1",
        border: {
          DEFAULT: "hsl(var(--border))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
