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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const processUrlForView = (inputUrl: string): string => {
  if (!inputUrl || typeof inputUrl !== 'string') return inputUrl;

  try {
    // Handle standard YouTube watch URLs
    if (inputUrl.includes('youtube.com/watch')) {
      const url = new URL(inputUrl);
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    // Handle youtu.be short URLs
    if (inputUrl.includes('youtu.be/')) {
      const url = new URL(inputUrl);
      const videoId = url.pathname.substring(1);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (e) {
    // Not a valid URL, or some other parsing error. Fallback to original URL.
    return inputUrl;
  }
  
  // Return original URL if it's not a convertible YouTube URL
  return inputUrl;
};


export default function HomePage() {
  const [numCameras, setNumCameras] = useState<number>(4);
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(4).fill(''));
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [message, setMessage] = useState<{type: 'error' | 'warning', text: string} | null>(null);
  const [userAcknowledgedWarning, setUserAcknowledgedWarning] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [mobileView, setMobileView] = useState<'canales' | 'eventos'>('canales');

  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(true);

  const topBarColorClass = useMemo(() => {
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    
    if (activeStatuses.includes('empty')) {
        return 'bg-red-500';
    }
    if (activeStatuses.includes('unknown')) {
      return 'bg-yellow-500';
    }
    if (activeStatuses.length > 0 && activeStatuses.every(s => s === 'valid')) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  }, [cameraStatuses, numCameras]);

  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const response = await fetch('https://corsproxy.io/?https%3A%2F%2Fstreamtpglobal.com%2Fstatus.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const statuses = data.reduce((acc: Record<string, 'online' | 'offline'>, item: any) => {
          if (item.Canal) {
            acc[item.Canal] = item.Estado === 'Activo' ? 'online' : 'offline';
          }
          return acc;
        }, {});
        setChannelStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch channel statuses:", error);
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, []);

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
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    } else {
      setNumCameras(4);
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
      setMessage({ type: 'warning', text: "Hay un link o texto desconocido que puede no ser procesado, desea seguir de todas formas?" });
      setUserAcknowledgedWarning(true);
      return;
    }

    setUserAcknowledgedWarning(false);
    const processedUrls = activeUrls.map(processUrlForView);
    const queryParams = new URLSearchParams();
    processedUrls.forEach(url => queryParams.append('urls', encodeURIComponent(url)));
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
                {mobileView === 'canales' && <ChannelListComponent channelStatuses={channelStatuses} isLoading={isLoadingStatuses} />}
                {mobileView === 'eventos' && (
                  <iframe
                    src="https://agenda-dpt.vercel.app/"
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
          <div className="flex-grow flex flex-col items-center justify-center gap-6 px-4">
              <div className="flex flex-col items-center gap-2">
                <WelcomeMessage />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground px-1 py-0 h-auto">Aviso Legal</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Aviso Legal</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                      <p>
                          DEPORTES PARA TODOS es un proveedor de servicios de Internet que ofrece una plataforma que solo muestra enlaces a contenidos audiovisuales ubicados en servidores de terceros y provistos y/o transmitidos por terceros. Nadie puede responsabilizar a DEPORTES PARA TODOS de alojar contenido con copyright, ya que nosotros no alojamos ningún contenido con derechos de autor ni tampoco transmitimos ningún contenido audiovisual. Por favor: Averigüe bien en qué sitio web están realmente alojados sus archivos o contenido audiovisual antes de culpar a DEPORTES PARA TODOS de infringir derechos de autor.
                      </p>
                      <p>
                          Los enlaces que figuran en esta web han sido encontrados en diferentes webs de streaming online (ustream.tv, justin.tv, yukons.net, mips.tv, dinozap.tv, castalba.tv, sawlive.tv, entre otros...) y desconocemos si los mismos tienen contratos de cesión de derechos sobre estos partidos o eventos de pago para reproducirlos, alojarlos o permitir verlos. Todas las marcas aquí mencionadas y logos están registrados por sus legítimos propietarios y solamente se emplean en referencia a las mismas y con un fin de cita o comentario. No nos hacemos responsables del uso indebido que puedes hacer del contenido de nuestra página. Todo el contenido ha sido exclusivamente sacado de sitios públicos de Internet, por lo que este material es considerado de libre distribución. En ningún artículo legal se menciona la prohibición de material libre, por lo que esta página no infringe en ningún caso la ley. Si alguien tiene alguna duda o problema al respecto, no dude en ponerse en contacto con nosotros.
                      </p>
                      <p>
                          En ningún caso o circunstancia se podrá responsabilizar directa o indirectamente al propietario ni a los colaboradores de DEPORTES PARA TODOS del ilícito uso de la información contenida en rojadirectaenvivo.pl. Asimismo, tampoco se nos podrá responsabilizar directa o indirectamente del incorrecto uso o mala interpretación que se haga de la información y servicios incluidos. Igualmente, quedará fuera de nuestra responsabilidad el material al que usted pueda acceder desde nuestros enlaces.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="w-full max-w-lg">
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