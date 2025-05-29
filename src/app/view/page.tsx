"use client"; // For useRouter and useSearchParams

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useEffect, useState } from 'react';

export default function ViewPage() {
  const searchParams = useSearchParams();
  const [urls, setUrls] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const urlParams = searchParams.getAll('urls');
    setUrls(urlParams.map(url => decodeURIComponent(url)));
  }, [searchParams]);
  
  if (!isMounted) {
    // Optional: render a loading state or null
    return (
        <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
            <p>Cargando vistas...</p>
        </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No se proporcionaron URLs de transmisión.</p>
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline">
            <XCircle className="mr-2 h-4 w-4" /> Volver Atrás
          </Button>
        </Link>
      </div>
    );
  }

  const numIframes = urls.length;
  let gridContainerClasses = "grid gap-1 p-1 flex-grow w-full h-full";

  if (numIframes === 1) {
    gridContainerClasses += " grid-cols-1 grid-rows-1";
  } else if (numIframes === 2) {
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  } else { // For 3 or 4 iframes
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-auto"; // Creates a 2xN layout
  }
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-background z-10">
        <h1 className="text-xl font-semibold text-primary">Vista Multi-Stream</h1>
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline" size="sm">
            <XCircle className="mr-2 h-4 w-4" /> Cerrar Vista
          </Button>
        </Link>
      </header>
      <main className={gridContainerClasses}>
        {urls.map((url, index) => (
          <div
            key={index}
            className={`bg-muted/50 rounded shadow-inner overflow-hidden
              ${numIframes === 3 && index === 0 ? 'md:col-span-2' : ''} 
              ${numIframes === 3 && index > 0 ? 'md:col-span-1' : ''}
            `}
          >
            <iframe
              src={url}
              title={`Stream ${index + 1}`}
              className="w-full h-full border-0 aspect-video min-h-[200px]"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation" // Recommended for security
            ></iframe>
          </div>
        ))}
         {/* Placeholder for 3 streams in 2x2 grid */}
         {numIframes === 3 && <div className="hidden md:block"></div>}
      </main>
    </div>
  );
}
