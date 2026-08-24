import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Gabarito: tipografía oficial del Policlínico San Damián (Manual de
// Identidad Corporativa, sección B07 — Tipografía Principal).
const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito" });

export const metadata: Metadata = {
  title: "Policlínico San Damián | Sistema Financiero",
  description: "Control financiero y administrativo del Policlínico San Damián",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${gabarito.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
