
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Corrected import
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const geistSans = Geist({ // Corrected usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Corrected usage
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
        <link rel="preload" href="https://i.ibb.co/YBjHxj6Z/TUTORIAL-1.jpg" as="image" />
        <link rel="preload" href="https://i.ibb.co/N2hpR2Jy/TUTORIAL-2.jpg" as="image" />
        <link rel="preload" href="https://i.ibb.co/hJR6tmYj/TUTORIAL-3.jpg" as="image" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
