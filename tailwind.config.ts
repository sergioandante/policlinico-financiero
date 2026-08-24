import type { Config } from "tailwindcss";

// Paleta propia del proyecto, tomada del Manual de Identidad Corporativa del
// Policlínico San Damián:
// - "brand" (azul institucional): 600=#0043D1 (Azul de Acento, PANTONE 2728 C),
//   800=#102353 (Azul Corporativo Secundario, PANTONE 2767 C) y
//   900=#0B173A (Azul Corporativo Principal, PANTONE 296 C). Los pasos
//   intermedios se interpolan para tener una escala utilizable en toda la UI.
// - "ingreso" / "egreso" / "alerta": colores semánticos fijos para dinero en TODA la app,
//   así el usuario aprende de un vistazo "verde = entra, rojo = sale, ámbar = atención".
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2fc",
          100: "#dbe6fa",
          200: "#b8ccf5",
          300: "#8babef",
          400: "#4d7ce6",
          500: "#1a54dd",
          600: "#0043d1", // Azul de Acento — primario (botones, iconos)
          700: "#00368a",
          800: "#102353", // Azul Corporativo Secundario (texto, acentos)
          900: "#0b173a", // Azul Corporativo Principal (fondos, cabeceras)
        },
        ingreso: { DEFAULT: "#16a34a", bg: "#eafaf0" },
        egreso: { DEFAULT: "#dc2626", bg: "#fdecec" },
        alerta: { DEFAULT: "#d97706", bg: "#fef3e2" },
        ink: "#0b173a",
        surface: "#f5f5f5",
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
        // Gabarito es la tipografía oficial del Policlínico San Damián
        // (Manual de Identidad Corporativa, sección B07): se usa tanto para
        // titulares como para texto de cuerpo en toda la comunicación oficial.
        display: ["var(--font-gabarito)", "sans-serif"],
        sans: ["var(--font-gabarito)", "sans-serif"],
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
