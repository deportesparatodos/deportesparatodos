
"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from "lucide-react";
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";

function ViewPageContent() {
  const searchParams = useSearchParams();
  const urls: string[] = searchParams.getAll('urls').map((url: string) => decodeURIComponent(url));
  const gapParam = searchParams.get('gap');
  const gap = gapParam ? parseInt(gapParam, 10) : 0;
  const borderColorParam = searchParams.get('borderColor');
  const borderColor = borderColorParam ? decodeURIComponent(borderColorParam) : '#18181b';

  if (urls.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No se proporcionaron URLs de transmisión.</p>
        <Button asChild>
          <Link href="/">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </Link>
        </Button>
      </div>
    );
  }

  const numIframes = urls.length;
  let gridContainerClasses = "grid flex-grow w-full h-full";

  // Define grid structure based on the number of iframes
  if (numIframes === 1) {
    gridContainerClasses += " grid-cols-1 grid-rows-1";
  } else if (numIframes === 2) {
    // For 2, stack on mobile, side-by-side on desktop
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  } else {
    // For 3 or 4, use a 2x2 grid on desktop for consistent layout
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 md:grid-rows-2";
  }
  
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <Link 
        href="/" 
        className="absolute top-2 right-2 z-20 p-2 rounded-md text-foreground hover:bg-accent/70 hover:text-accent-foreground transition-colors"
        aria-label="Cerrar Vista"
      >
        <X className="h-6 w-6" />
      </Link>
      
      <main 
        className={gridContainerClasses} 
        style={{ 
          gap: `${gap}px`,
          padding: `${gap}px`,
          backgroundColor: borderColor
        }}
      >
        {urls.map((url: string, index: number) => (
          <div
            key={index}
            // By using a consistent grid structure, we don't need conditional classes here.
            // Each iframe will flow into its designated grid cell.
            className="bg-muted/50 overflow-hidden"
          >
            <iframe
              src={url}
              title={`Stream ${index + 1}`}
              // Removed aspect-video and min-h to allow the iframe to fully fill the grid cell
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
      <p>Cargando vistas...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ViewPageContent />
    </Suspense>
  );
}
