
"use client";

import Link from 'next/link';
import { X, Loader2, Menu, MessageSquare, HelpCircle, AlertCircle, FileText, Mail, Settings } from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-carousel';
import { addHours, isAfter, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { ScheduledLayoutChange } from '@/components/schedule-manager';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const getOrderClass = (order: number) => {
    switch (order) {
        case 1: return "order-1";
        case 2: return "order-2";
        case 3: return "order-3";
        case 4: return "order-4";
        case 5: return "order-5";
        case 6: return "order-6";
        case 7: return "order-7";
        case 8: return "order-8";
        case 9: return "order-9";
        default: return "order-none";
    }
};

function ViewPageContent() {
  const [urls, setUrls] = useState<string[]>(Array(9).fill(''));
  const [numCameras, setNumCameras] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));
  
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (welcomePopupOpen && !isSubDialogOpen) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setWelcomePopupOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100); 
    }
    return () => clearInterval(interval);
  }, [welcomePopupOpen, isSubDialogOpen]);

  useEffect(() => {
    setIsMounted(true);
    setWelcomePopupOpen(true);
    setProgress(100);

    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(9).fill('');
      parsedUrls.slice(0, 9).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setUrls(newUrls);
    }
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    }
    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) {
      setGridGap(parseInt(storedGap, 10));
    }
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) {
      setBorderColor(storedBorderColor);
    }
    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) {
      setIsChatEnabled(JSON.parse(storedChatEnabled));
    }
    const storedViewOrder = localStorage.getItem('viewOrder');
    if (storedViewOrder) {
        try {
            const parsedOrder = JSON.parse(storedViewOrder);
            if(Array.isArray(parsedOrder) && parsedOrder.length === 9) {
                setViewOrder(parsedOrder);
            }
        } catch(e) {
            console.error("Failed to parse viewOrder from localStorage", e);
        }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('viewOrder', JSON.stringify(viewOrder));
    }
  }, [viewOrder, isMounted]);


  const urlsToDisplay = useMemo(() => {
      const activeUrls = urls.slice(0, numCameras);
      return activeUrls.map((url, index) => ({
          url,
          originalIndex: index,
          reloadKey: reloadCounters[index] || 0,
      }));
  }, [urls, numCameras, reloadCounters]);


  if (!isMounted) {
    return <Loading />;
  }
  
  if (urlsToDisplay.filter(item => item.url && item.url.trim() !== "").length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No hay URLs seleccionadas para mostrar.</p>
        <Button asChild>
          <Link href="/">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </Link>
        </Button>
      </div>
    );
  }

  const numIframes = numCameras;
  let gridContainerClasses = "grid flex-grow w-full h-full";

  switch (numIframes) {
    case 1:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
      break;
    case 2:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
      break;
    case 3:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 md:grid-rows-2";
      break;
    case 4:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2";
      break;
    case 6:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-6 md:grid-rows-2";
      break;
    case 9:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-9 md:grid-rows-3";
      break;
    default:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
  }


  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
          <DialogContent className="sm:max-w-md p-0">
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <DialogHeader className="px-6 pt-8 pb-2 text-center">
                  <DialogTitle>¡Bienvenido a Deportes para Todos!</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground text-left">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
              </div>
          </DialogContent>
      </Dialog>
      <div className="relative flex flex-col h-screen flex-grow">
        <div
          className={cn(
            "absolute z-20 flex items-center gap-2",
            isChatOpen && !isMobile ? "flex-row-reverse left-0" : "right-0"
          )}
          style={
             isChatOpen && !isMobile 
              ? { top: `${gridGap}px`, left: `${gridGap}px` } 
              : { top: `${gridGap}px`, right: `${gridGap}px` }
          }
        >
          {isChatEnabled && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-transparent hover:bg-accent/80 text-white h-10 w-10" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label="Abrir o cerrar chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "bg-transparent hover:bg-accent/80 text-white h-10 w-10")}
            aria-label="Cerrar Vista"
          >
            <X className="h-7 w-7 text-white" />
          </Link>
        </div>
        
        <main 
          className={gridContainerClasses} 
          style={{ 
            gap: `${gridGap}px`,
            padding: `${gridGap}px`,
            backgroundColor: borderColor
          }}
        >
          {urlsToDisplay.map((item) => {
            const visualOrder = viewOrder.indexOf(item.originalIndex);
            
            const windowClasses: string[] = ["overflow-hidden", "relative", "bg-black"];
            if (!item.url) {
                windowClasses.push("bg-red-500", "flex", "items-center", "justify-center", "text-destructive-foreground", "font-bold");
            }
             if (numIframes === 3) {
              windowClasses.push(
                'md:col-span-1 md:row-span-1',
                visualOrder === 0 ? 'md:col-span-2' : ''
              );
            }
            
            let iframeSrc = item.url 
              ? `${item.url}${item.url.includes('?') ? '&' : '?'}reload=${item.reloadKey}`
              : '';

            if (iframeSrc.includes("youtube-nocookie.com")) {
                iframeSrc += `&autoplay=1`;
            }

            return (
              <div
                key={`${item.originalIndex}-${item.reloadKey}`}
                className={cn(windowClasses, getOrderClass(visualOrder + 1))}
              >
                {item.url ? (
                  <iframe
                    src={iframeSrc}
                    title={`Stream ${item.originalIndex + 1}`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white font-bold text-xl bg-muted/20">
                    VENTANA VACÍA
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
      
       {/* Chat Sidebar for Desktop */}
       <div
        className={cn(
          'w-80 flex-shrink-0 bg-background flex-col border-l border-border',
          isChatOpen && !isMobile ? 'flex' : 'hidden'
        )}
      >
        <div className="p-2 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold">Chat en Vivo</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
          title="Chat en Vivo"
          className="w-full flex-grow border-0"
        />
      </div>

      {/* Chat Dialog for Mobile */}
      {isMobile && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="p-0 border-0 w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>Chat en Vivo</DialogTitle>
            </DialogHeader>
            <iframe
              src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
              title="Chat en Vivo"
              className="w-full flex-grow border-0"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2">Cargando vistas...</p>
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
