import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script'; // Agregado para scripts externos
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import React from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DEPORTES PARA TODOS',
  description: 'Visualiza múltiples transmisiones deportivas simultáneamente.', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        {/* Script popunder solo aquí, usando Next.js */}
        <Script id="popunder-tag" strategy="afterInteractive">
          {`(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://al5sm.com/tag.min.js',9491500,document.body||document.documentElement);`}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  );
}