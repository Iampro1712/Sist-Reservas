import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReservaFácil - Sistema de Reservas Inteligente",
  description: "Sistema completo de reservas con disponibilidad en tiempo real, notificaciones automáticas y gestión de calendarios. Perfecto para clínicas, salones, restaurantes y más.",
  keywords: ["reservas", "citas", "calendario", "disponibilidad", "notificaciones", "clínica", "salón", "restaurante"],
  authors: [{ name: "ReservaFácil Team" }],
  creator: "ReservaFácil",
  publisher: "ReservaFácil",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
