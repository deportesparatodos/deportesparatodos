
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; 

export const metadata: Metadata = {
  title: 'DEPORTES PARA TODOS', // Updated title
  description: 'Visualiza múltiples transmisiones deportivas simultáneamente.', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

    
