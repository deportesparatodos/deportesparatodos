"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeMessage } from '@/components/welcome-message';
import { CameraConfigurationComponent, type CameraStatus } from '@/components/camera-configuration';
import { cn } from "@/lib/utils";
import { channels } from '@/components/channel-list';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { ChannelListComponent } from '@/components/channel-list';

export default function HomePage() {
  const [numCameras, setNumCameras] = useState<number>(4);
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(4).fill(''));
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [message, setMessage] = useState<{type: 'error' | 'warning', text: string} | null>(null);
  const [userAcknowledgedWarning, setUserAcknowledgedWarning] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [mobileView, setMobileView] = useState<'canales' | 'eventos'>('canales');

  const topBarColorClass = useMemo(() => {
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    if (activeStatuses.includes('unknown')) {
      return 'bg-yellow-500';
    }
    if (activeStatuses.includes('empty')) {
        return 'bg-red-500';
    }
    if (activeStatuses.length > 0 && activeStatuses.every(s => s === 'valid')) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  }, [cameraStatuses, numCameras]);

  useEffect(() => {
    setIsMounted(true);
    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(4).fill('');
      parsedUrls.slice(0, 4).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setCameraUrls(newUrls);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(cameraUrls));
      localStorage.setItem('numCameras', numCameras.toString());
    }
  }, [cameraUrls, numCameras, isMounted]);

  const handleStartView = () => {
    setMessage(null);
    const activeUrls = cameraUrls.slice(0, numCameras);
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    const hasEmptyUrls = activeStatuses.includes('empty');
    const hasUnknownUrls = activeStatuses.includes('unknown');

    if (hasEmptyUrls) {
      setMessage({ type: 'error', text: `Por favor, ingrese las URLs para ${numCameras === 1 ? 'la vista seleccionada' : `las ${numCameras} vistas seleccionadas`}.` });
      setUserAcknowledgedWarning(false);
      return;
    }

    if (hasUnknownUrls && !userAcknowledgedWarning) {
      setMessage({ type: 'warning', text: "Hay un link o texto desconocido que no puede ser procesado, desea seguir de todas formas?" });
      setUserAcknowledgedWarning(true);
      return;
    }

    setUserAcknowledgedWarning(false);
    const queryParams = new URLSearchParams();
    activeUrls.forEach(url => queryParams.append('urls', encodeURIComponent(url)));
    router.push(`/view?${queryParams.toString()}`);
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
        <div className="absolute top-4 left-4 z-20">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0 gap-0" hideClose>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="border-b border-border">
                <div className="flex items-center gap-2 p-4">
                  <Button onClick={() => setMobileView('canales')} variant={mobileView === 'canales' ? 'secondary' : 'ghost'} className="flex-1">Lista de Canales</Button>
                  <Button onClick={() => setMobileView('eventos')} variant={mobileView === 'eventos' ? 'secondary' : 'ghost'} className="flex-1">Lista de Eventos</Button>
                  <SheetClose asChild>
                     <Button variant="destructive" size="icon" className="flex-shrink-0">
                       <X className="h-4 w-4" />
                     </Button>
                  </SheetClose>
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                {mobileView === 'canales' && <ChannelListComponent />}
                {mobileView === 'eventos' && (
                  <iframe
                    src="https://agendadeportiva-alpha.vercel.app/"
                    title="Agenda Deportiva"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-clipboard-write"
                    allow="clipboard-write"
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="w-full flex-grow flex flex-col relative">
          <div className={cn("h-2 w-full absolute top-0 left-0", topBarColorClass)} />
          <div className="flex-grow flex flex-col items-center justify-center overflow-y-auto gap-4">
             <WelcomeMessage />
              <div className="w-full max-w-lg px-4">
                <CameraConfigurationComponent
                  numCameras={numCameras}
                  setNumCameras={(num) => {
                    setNumCameras(num);
                    setMessage(null);
                    setUserAcknowledgedWarning(false);
                  }}
                  cameraUrls={cameraUrls}
                  setCameraUrls={setCameraUrls}
                  message={message}
                  setMessage={setMessage}
                  handleStartView={handleStartView}
                  channels={channels}
                  setCameraStatuses={setCameraStatuses}
                  setUserAcknowledgedWarning={setUserAcknowledgedWarning}
                />
              </div>
          </div>
        </div>
    </div>
  );
}
