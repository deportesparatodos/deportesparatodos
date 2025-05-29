
"use client"; // For useRouter and useSearchParams

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from "lucide-react"; // Changed from XCircle to X
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
          <button className="flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </button>
        </Link>
      </div>
    );
  }

  const numIframes = urls.length;
  let gridContainerClasses = "grid gap-0 flex-grow w-full h-full"; // Removed p-1 and set gap-0

  if (numIframes === 1) {
    gridContainerClasses += " grid-cols-1 grid-rows-1";
  } else if (numIframes === 2) {
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  } else { // For 3 or 4 iframes
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-auto"; 
  }
  
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <Link 
        href="/" 
        passHref 
        className="absolute top-2 right-2 z-20 p-2 rounded-md text-foreground hover:bg-accent/70 hover:text-accent-foreground transition-colors"
        aria-label="Cerrar Vista"
      >
        <X className="h-6 w-6" />
      </Link>
      
      <main className={gridContainerClasses}>
        {urls.map((url, index) => (
          <div
            key={index}
            className={`bg-muted/50 overflow-hidden
              ${numIframes === 3 && index === 0 ? 'md:col-span-2' : ''} 
              ${numIframes === 3 && index > 0 ? 'md:col-span-1' : ''}
            `}
          >
            <iframe
              src={url}
              title={`Stream ${index + 1}`}
              className="w-full h-full border-0 aspect-video min-h-[150px]" // min-h reduced slightly
              allowFullScreen
              // sandbox attribute entirely removed
            ></iframe>
          </div>
        ))}
         {/* Placeholder for 3 streams in 2x2 grid */}
         {numIframes === 3 && <div className="hidden md:block bg-muted/50"></div>}
      </main>
    </div>
  );
}
