import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Toda la app depende de la sesión del usuario, así que ninguna ruta puede
// mostrar un shell instantáneo: se permite que la navegación espere al servidor.
export const instant = false;

export const metadata: Metadata = {
  title: "Kilaje",
  description: "Seguimiento de rutinas y progreso de pesos en el gimnasio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Todas las páginas dependen del usuario logueado: se renderizan por pedido. */}
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
