
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WelcomeMessage } from '@/components/welcome-message';
import { CameraConfigurationComponent, type CameraStatus } from '@/components/camera-configuration';
import { cn } from "@/lib/utils";
import { channels } from '@/components/channel-list';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, X, HelpCircle, FileText, Mail, AlertCircle, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { Event } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';


const defaultEventGrouping = {
  all: true,
  enVivo: true,
  otros: true,
  f1: true,
  mlb: true,
  nba: true,
  mundialDeClubes: true,
  deportesDeCombate: true,
  liga1: true,
  ligaPro: true,
  mls: true,
};

export default function HomePage() {
  const [numCameras, setNumCameras] = useState<number>(1);
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(9).fill(''));
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(true);

  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#18181b');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [eventGrouping, setEventGrouping] = useState(defaultEventGrouping);


  const topBarColorClass = useMemo(() => {
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    
    if (activeStatuses.includes('empty') || activeStatuses.includes('inactive') || activeStatuses.some((s, i) => s === 'unknown' && cameraUrls[i])) {
        return 'bg-red-500';
    }
    if (activeStatuses.length > 0 && activeStatuses.every(s => s === 'valid')) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  }, [cameraStatuses, numCameras, cameraUrls]);

  useEffect(() => {
    const processAndSetEvents = () => {
      if (!events.length) {
        setProcessedEvents([]);
        return;
      }
      
      const now = new Date();
      const timeZone = 'America/Argentina/Buenos_Aires';

      const eventsWithStatus = events
        .map(e => {
            const eventStart = toZonedTime(`${e.date}T${e.time}:00`, timeZone);
            if (isNaN(eventStart.getTime())) {
              return { ...e, status: 'Finalizado' as const };
            }
            const eventEnd = addHours(eventStart, 3);
            
            let status: Event['status'] = 'Próximo';
            if (isAfter(now, eventEnd)) {
                status = 'Finalizado';
            } else if (isAfter(now, eventStart)) {
                status = 'En Vivo';
            }
            return { ...e, status };
        });

      const ongoingOrUpcomingEvents = eventsWithStatus.filter(
        e => e.status !== 'Finalizado'
      );

      const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2 };

      ongoingOrUpcomingEvents.sort((a, b) => {
          if (a.status !== b.status) {
              return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
          }
          return a.time.localeCompare(b.time);
      });

      setProcessedEvents(ongoingOrUpcomingEvents);
    };

    processAndSetEvents();
    const timerId = setInterval(processAndSetEvents, 60000);

    return () => clearInterval(timerId);
  }, [events]);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const response = await fetch('https://agenda-dpt.vercel.app/api/events');
      if (!response.ok) {
        throw new Error('No se pudieron cargar los eventos.');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      if (err instanceof Error) {
          setEventsError(err.message);
      } else {
          setEventsError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

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
    fetchEvents();
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(9).fill('');
      parsedUrls.slice(0, 9).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setCameraUrls(newUrls);
    }
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    } else {
      setNumCameras(1);
    }
    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) {
      setGridGap(parseInt(storedGap, 10));
    } else {
      setGridGap(0);
    }
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) {
      setBorderColor(storedBorderColor);
    }
    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) {
      setIsChatEnabled(JSON.parse(storedChatEnabled));
    } else {
      setIsChatEnabled(true);
    }
     const storedEventGrouping = localStorage.getItem('eventGrouping');
    if (storedEventGrouping) {
      try {
        const parsed = JSON.parse(storedEventGrouping);
        if (typeof parsed === 'object' && parsed !== null && 'all' in parsed) {
          setEventGrouping({ ...defaultEventGrouping, ...parsed });
        }
      } catch (e) {
        console.error("Failed to parse eventGrouping from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(cameraUrls));
      localStorage.setItem('numCameras', numCameras.toString());
      localStorage.setItem('gridGap', gridGap.toString());
      localStorage.setItem('borderColor', borderColor);
      localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
      localStorage.setItem('eventGrouping', JSON.stringify(eventGrouping));
    }
  }, [cameraUrls, numCameras, gridGap, borderColor, isChatEnabled, eventGrouping, isMounted]);

  const handleGridGapChange = (value: number[]) => {
    const newGap = value[0];
    setGridGap(newGap);
  };

  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);
  };
  
  const handleRestoreDefaults = () => {
    const defaultGap = 0;
    const defaultColor = '#18181b'; 
    setGridGap(defaultGap);
    setBorderColor(defaultColor);
  };

  const handleMasterGroupingChange = (checked: boolean) => {
    setEventGrouping(prev => ({ ...prev, all: checked }));
  };

  const handleIndividualGroupingChange = (key: 'enVivo' | 'otros' | 'f1' | 'mlb' | 'nba' | 'mundialDeClubes' | 'deportesDeCombate' | 'liga1' | 'ligaPro' | 'mls', checked: boolean) => {
    setEventGrouping(prev => ({ ...prev, [key]: checked }));
  };

  const handleStartView = () => {
    const activeUrlInputs = cameraUrls.slice(0, numCameras);
    const activeUrls = activeUrlInputs.filter(url => url && url.trim() !== "");

    if (activeUrls.length === 0) {
        setMessages(["Por favor, selecciona al menos 1 canal o evento para poder continuar."]);
        setAcknowledged(false); 
        return;
    }

    const activeStatuses = cameraStatuses.slice(0, numCameras);
  
    setMessages([]);
  
    const warningMessages: string[] = [];
    let emptyViewCount = 0;
    let unknownLinkCount = 0;
    let inactiveChannelCount = 0;
  
    activeUrlInputs.forEach((url, i) => {
      if (!url || url.trim() === "") {
        emptyViewCount++;
      } else if (activeStatuses[i] === "inactive") {
        inactiveChannelCount++;
      } else if (activeStatuses[i] === "unknown") {
        unknownLinkCount++;
      }
    });
  
    if (emptyViewCount > 0) {
      const pluralS = emptyViewCount > 1 ? "s" : "";
      warningMessages.unshift(
        `Hay ${emptyViewCount} vista${pluralS} vacía${pluralS}. Si presionas "Iniciar Vista" se iniciará la vista solo con las ventanas que están llenas.`
      );
    }
  
    if (inactiveChannelCount > 0) {
      const pluralNoun = inactiveChannelCount > 1 ? 'canales' : 'canal';
      const pluralAdj = inactiveChannelCount > 1 ? 'inactivos' : 'inactivo';
      warningMessages.push(
        `Hay ${inactiveChannelCount} ${pluralNoun} ${pluralAdj}. Si presionas "Iniciar Vista" se iniciará la vista de todas formas (posibles fallos).`
      );
    }
  
    if (unknownLinkCount > 0) {
      const pluralS = unknownLinkCount > 1 ? "s" : "";
      warningMessages.push(
        `Hay ${unknownLinkCount} link${pluralS} desconocido${pluralS}. Si presionas "Iniciar Vista" se iniciará la vista de todas formas (posibles fallos).`
      );
    }
  
    if (warningMessages.length > 0 && !acknowledged) {
      setMessages(warningMessages);
      setAcknowledged(true);
      return;
    }
    
    setAcknowledged(false);
    
    router.push(`/view`);
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className="absolute top-4 left-4 z-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="bg-white text-background hover:bg-white/90">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-full sm:w-96 flex flex-col p-6 gap-4" 
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex justify-center">
                <Image
                src="https://i.ibb.co/BVLhxp2k/deportes-para-todos.png"
                alt="Deportes Para Todos Logo"
                width={250}
                height={62.5}
                priority
                data-ai-hint="logo"
              />
            </div>
            <Separator />

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg flex flex-col p-0 max-h-[90vh]">
                <DialogHeader className="p-4 py-3 border-b">
                  <DialogTitle>Configuración:</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto p-4">
                  <Accordion type="multiple" collapsible className="w-full space-y-4">
                    <AccordionItem value="item-1" className="border rounded-md px-1">
                      <AccordionTrigger className="p-3 hover:no-underline">Bordes</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-2 px-3 pb-3">
                          <div className="space-y-2">
                              <Label htmlFor="grid-gap-slider">Tamaño de Bordes ({gridGap}px)</Label>
                              <Slider
                                  id="grid-gap-slider"
                                  min={0}
                                  max={32}
                                  step={1}
                                  value={[gridGap]}
                                  onValueChange={handleGridGapChange}
                              />
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="border-color-input">Color de Bordes</Label>
                              <div className="flex items-center gap-2">
                                  <Input
                                      id="border-color-input"
                                      value={borderColor}
                                      onChange={(e) => handleBorderColorChange(e.target.value)}
                                      className="flex-grow"
                                  />
                                  <div
                                      className="h-8 w-8 rounded-md border border-input"
                                      style={{ backgroundColor: borderColor }}
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <Label>Vista Previa</Label>
                              <div
                                  className="grid h-48 grid-cols-2 grid-rows-2 rounded-md transition-all border border-black"
                                  style={{
                                      gap: `${gridGap}px`,
                                      padding: `${gridGap}px`,
                                      backgroundColor: borderColor,
                                  }}
                              >
                                  <div className="rounded-md bg-background" />
                                  <div className="rounded-md bg-background" />
                                  <div className="rounded-md bg-background" />
                                  <div className="rounded-md bg-background" />
                              </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border rounded-md px-1">
                      <AccordionTrigger className="p-3 hover:no-underline">Chat</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-2 px-3 pb-3">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label htmlFor="chat-switch" className="text-base">Activar Chat en Vivo</Label>
                              <p className="text-sm text-muted-foreground">
                                Muestra el botón para abrir el chat en la página de visualización.
                              </p>
                            </div>
                            <Switch
                              id="chat-switch"
                              checked={isChatEnabled}
                              onCheckedChange={setIsChatEnabled}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-b-0 border rounded-md px-1">
                        <AccordionTrigger className="p-3 hover:no-underline">Eventos</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-6 pt-2 px-3 pb-3">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="group-all-switch" className="text-base">Agrupar todos los eventos</Label>
                                <p className="text-sm text-muted-foreground">Activa o desactiva todas las agrupaciones.</p>
                              </div>
                              <Switch
                                id="group-all-switch"
                                checked={eventGrouping.all}
                                onCheckedChange={handleMasterGroupingChange}
                              />
                            </div>

                            <div className={cn("space-y-4 rounded-lg border p-4", !eventGrouping.all && "opacity-50 pointer-events-none")}>
                               <div className="flex items-center justify-between">
                                <Label htmlFor="group-enVivo-switch" className="text-base">Agrupar "En Vivo"</Label>
                                <Switch
                                  id="group-enVivo-switch"
                                  checked={eventGrouping.enVivo}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('enVivo', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-otros-switch" className="text-base">Agrupar "Otros"</Label>
                                <Switch
                                  id="group-otros-switch"
                                  checked={eventGrouping.otros}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('otros', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                            </div>
                            
                            <div className={cn("space-y-4 rounded-lg border p-4", !eventGrouping.all && "opacity-50 pointer-events-none")}>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-f1-switch" className="text-base">Agrupar F1</Label>
                                <Switch
                                  id="group-f1-switch"
                                  checked={eventGrouping.f1}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('f1', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-mlb-switch" className="text-base">Agrupar MLB</Label>
                                <Switch
                                  id="group-mlb-switch"
                                  checked={eventGrouping.mlb}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('mlb', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-nba-switch" className="text-base">Agrupar NBA</Label>
                                <Switch
                                  id="group-nba-switch"
                                  checked={eventGrouping.nba}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('nba', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-mundial-switch" className="text-base">Agrupar Mundial de Clubes</Label>
                                <Switch
                                  id="group-mundial-switch"
                                  checked={eventGrouping.mundialDeClubes}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('mundialDeClubes', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-combate-switch" className="text-base">Agrupar Deportes de Combate</Label>
                                <Switch
                                  id="group-combate-switch"
                                  checked={eventGrouping.deportesDeCombate}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('deportesDeCombate', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-liga1-switch" className="text-base">Agrupar LIGA1</Label>
                                <Switch
                                  id="group-liga1-switch"
                                  checked={eventGrouping.liga1}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('liga1', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-ligapro-switch" className="text-base">Agrupar Liga Pro</Label>
                                <Switch
                                  id="group-ligapro-switch"
                                  checked={eventGrouping.ligaPro}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('ligaPro', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-mls-switch" className="text-base">Agrupar MLS</Label>
                                <Switch
                                  id="group-mls-switch"
                                  checked={eventGrouping.mls}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('mls', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                  </Accordion>
                </div>
                <DialogFooter className="p-4 border-t shrink-0">
                  <Button variant="outline" onClick={handleRestoreDefaults}>
                      Restaurar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="justify-start">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Tutorial
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                  <DialogHeader>
                      <DialogTitle>Tutorial de Uso</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                      <p>
                          ¡Bienvenido a Deportes para Todos! Esta guía te ayudará a sacar el máximo provecho de la plataforma.
                      </p>
                      <h4 className="font-semibold text-foreground pt-2">Paso 1: Selecciona la cantidad de ventanas</h4>
                      <p>
                          Usa el menú desplegable en el centro de la pantalla para elegir cuántas transmisiones quieres ver simultáneamente. Puedes seleccionar entre 1, 2, 3, 4, 6 o 9 ventanas.
                      </p>
                      <h4 className="font-semibold text-foreground pt-2">Paso 2: Elige tus canales o eventos</h4>
                      <p>
                          Para cada una de las ventanas que seleccionaste, verás un botón que dice "Elegir Canal…". Haz clic en él para abrir un diálogo con dos pestañas:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Canales:</strong> Una lista de canales de televisión disponibles 24/7. Puedes usar la barra de búsqueda para encontrar uno rápidamente.</li>
                          <li><strong>Eventos:</strong> Una lista de eventos deportivos en vivo o próximos a comenzar. Los eventos están agrupados por competición (puedes desactivar esto en la configuración).</li>
                      </ul>
                      <p>
                          Simplemente haz clic en "Seleccionar" en el canal o evento que desees, y se asignará a esa ventana. También puedes pegar un enlace de video directamente desde el portapapeles.
                      </p>
                      <h4 className="font-semibold text-foreground pt-2">Paso 3: Inicia la vista</h4>
                      <p>
                          Una vez que hayas configurado todas tus ventanas, presiona el botón "Iniciar Vista". Esto te llevará a una nueva página donde verás todas tus transmisiones seleccionadas en la disposición que elegiste.
                      </p>
                      <h4 className="font-semibold text-foreground pt-2">Configuraciones Adicionales</h4>
                      <p>
                          En el menú principal (arriba a la izquierda) encontrarás la sección de "Configuración", donde puedes personalizar tu experiencia:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Bordes:</strong> Ajusta el tamaño y el color de los bordes entre las ventanas de video.</li>
                          <li><strong>Chat:</strong> Activa o desactiva el chat en vivo en la página de visualización.</li>
                          <li><strong>Eventos:</strong> Activa o desactiva la agrupación de eventos por competición.</li>
                      </ul>
                      <h4 className="font-semibold text-foreground pt-2">Consejos Útiles</h4>
                      <ul className="list-disc pl-6 space-y-1">
                          <li>Puedes mover las ventanas hacia arriba o hacia abajo usando las flechas junto a cada selección.</li>
                          <li>Si un canal aparece como "Inactivo", es posible que no funcione.</li>
                          <li>Para cualquier problema, consulta las secciones de "Errores" o "Contacto" en el menú.</li>
                      </ul>
                  </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Contacto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contacto</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                  <p>
                    ¿Tienes alguna sugerencia o encontraste un error? ¡Tu opinión nos ayuda a mejorar! Comunícate con nosotros a través de <strong>deportesparatodosvercel@gmail.com</strong> para reportar fallos, enlaces incorrectos o proponer nuevos canales.
                  </p>
                </div>
                <DialogFooter>
                  <Button asChild>
                      <a href="mailto:deportesparatodosvercel@gmail.com">
                          <Mail className="mr-2 h-4 w-4" />
                          Contacto
                      </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Errores
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Solución de Errores Comunes</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                  <p>
                    En ocasiones, para reproducir los videos en esta página, es posible que necesites realizar una de las siguientes dos acciones. A continuación, te explicamos cuáles son y para qué sirven.
                  </p>

                  <h4 className="font-semibold text-foreground">Solución 1: Configurar el DNS de Cloudflare (1.1.1.1)</h4>
                  <p>
                    Si los videos no cargan o no se pueden reproducir, el primer paso que puedes intentar es cambiar el DNS de tu dispositivo.
                  </p>

                  <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                  <p>
                    El DNS (Sistema de Nombres de Dominio) es como una agenda de contactos de internet que traduce los nombres de las páginas web (como www.ejemplo.com) a una dirección IP numérica que las computadoras pueden entender. A veces, el DNS que te asigna tu proveedor de internet puede ser lento o bloquear el acceso a ciertos contenidos.
                  </p>
                  <p>
                    Al cambiar tu DNS a <strong>1.1.1.1</strong>, que es el servicio de DNS gratuito de Cloudflare, estás utilizando un servicio que a menudo es más rápido y privado. Esto puede resolver problemas de conexión y permitir que tu dispositivo acceda a los videos que antes no podía cargar.
                  </p>

                  <Separator className="my-4" />

                  <h4 className="font-semibold text-foreground">Solución 2: Instalar la extensión "Reproductor MPD/M3U8/M3U/EPG"</h4>
                  <p>
                    Si cambiar el DNS no soluciona el problema, la otra alternativa es instalar una extensión en tu navegador Google Chrome.
                  </p>
                  <p>
                    <strong>Extensión:</strong> Reproductor MPD/M3U8/M3U/EPG
                  </p>

                  <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                  <p>
                    Algunos videos en internet se transmiten en formatos especiales como M3U8 o MPD. No todos los navegadores web pueden reproducir estos formatos de forma nativa sin ayuda.
                  </p>
                  <p>
                    Esta extensión de Chrome funciona como un reproductor de video especializado que le añade a tu navegador la capacidad de entender y decodificar estos formatos de transmisión. Al instalarla, le das a Chrome las herramientas necesarias para que pueda reproducir correctamente los videos de la página.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2" />
                  Aviso Legal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Descargo de Responsabilidad – Derechos de Autor</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                  <p>
                      Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.
                  </p>
                  <p>
                      No participamos en la creación, alteración ni distribución de dichas señales, y no somos responsables de la legalidad de los contenidos a los que se accede a través de estos terceros. Cualquier infracción potencial corresponde a dichos proveedores externos.
                  </p>

                  <h4 className="font-semibold text-foreground">Sobre la legalidad y responsabilidad de terceros:</h4>
                  <p>
                      Existen antecedentes de sitios sancionados por alojar y retransmitir directamente contenido con derechos de autor. En contraste, Deportes para Todos no aloja señales ni transmite contenido, y se limita exclusivamente a insertar enlaces públicos de terceros mediante código iframe. No participamos en la obtención ni distribución del contenido audiovisual y no tenemos control sobre su disponibilidad o legalidad.
                  </p>

                  <h4 className="font-semibold text-foreground">Uso de marcas y logos:</h4>
                  <p>
                      Todas las marcas, nombres comerciales, logotipos o imágenes presentes en el sitio son propiedad de sus respectivos dueños. En Deportes para Todos se utilizan exclusivamente con fines informativos o ilustrativos, respetando el derecho de cita previsto por el Artículo 32 de la Ley 11.723 de Propiedad Intelectual de Argentina.
                  </p>

                  <h4 className="font-semibold text-foreground">Legislación aplicable:</h4>
                  <p>
                      Este sitio opera bajo las leyes de la República Argentina. El mero hecho de insertar un iframe público no configura, por sí solo, un delito conforme al derecho argentino, siempre que no se participe en la obtención o manipulación del contenido protegido.
                  </p>
                  
                  <h4 className="font-semibold text-foreground">Uso personal y responsabilidad del usuario:</h4>
                  <p>
                      El acceso a esta página se realiza bajo responsabilidad del usuario. Si en tu país este tipo de contenido se encuentra restringido, es tu obligación cumplir con las leyes locales. No nos responsabilizamos por el uso indebido o ilegal de los enlaces por parte de los visitantes.
                  </p>

                  <h4 className="font-semibold text-foreground">Sobre el uso de subdominios:</h4>
                  <p>
                      Deportes para Todos utiliza subdominios como https://www.google.com/search?q=gh.deportesparatodos.com con fines exclusivamente organizativos y técnicos, para centralizar y facilitar el acceso a iframes de terceros. Estos subdominios no almacenan, manipulan ni retransmiten contenido audiovisual, sino que actúan como una ventana hacia los streams originales disponibles públicamente en sitios como streamtp3.com, la12hd.com y otros. En ningún caso se modifica la fuente original ni se interviene en el contenido emitido por dichos terceros.
                  </p>

                  <h4 className="font-semibold text-foreground">Sobre la experiencia del usuario:</h4>
                  <p>
                      Deportes para Todos puede aplicar medidas para mejorar la experiencia de navegación, como la reducción de anuncios emergentes o contenido intrusivo de terceros. Estas medidas no interfieren con el contenido audiovisual transmitido dentro de los reproductores embebidos, ni modifican las señales originales. Cualquier bloqueo se limita a elementos externos ajenos a la emisión en sí.
                  </p>

                  <h4 className="font-semibold text-foreground">Monetización, publicidad y patrocinadores</h4>
                  <p>
                      Deportes para Todos puede exhibir anuncios publicitarios proporcionados por plataformas de monetización de terceros (como Monetag) y/o incluir contenido patrocinado de empresas vinculadas al sector iGaming (casas de apuestas, juegos online y plataformas similares).
                  </p>
                  <p>
                      Estos ingresos publicitarios permiten el mantenimiento del sitio, pero no están directamente vinculados al contenido embebido ni implican relación comercial con las plataformas desde las cuales se obtiene dicho contenido.
                  </p>
                  <p>
                      Deportes para Todos no gestiona ni opera plataformas de apuestas, ni aloja contenido audiovisual, y no obtiene beneficios económicos derivados de la transmisión de señales protegidas. Toda la monetización se genera por el tráfico general del sitio, independientemente del contenido de terceros que se pueda visualizar mediante iframes.
                  </p>
                  <p>
                      Los contenidos promocionados, ya sea por publicidad programática o acuerdos de patrocinio, se presentan conforme a la legislación vigente y no representan un respaldo o relación directa con los titulares de los derechos de las transmisiones que pudieran visualizarse mediante terceros.
                  </p>
                  <p>
                      Nos reservamos el derecho de incluir o remover campañas publicitarias en cualquier momento, y recomendamos a los usuarios consultar la política de privacidad de cada plataforma externa a la que accedan desde este sitio.
                  </p>

                  <h4 className="font-semibold text-foreground">Relación con los dueños del contenido:</h4>
                  <p>
                      Deportes para Todos no tiene relación alguna con los titulares de los derechos de las transmisiones embebidas, ni con las plataformas que los alojan. Todo el contenido audiovisual visualizado mediante iframes es responsabilidad exclusiva del sitio externo que lo provee.
                  </p>

                  <h4 className="font-semibold text-foreground">Mecanismos de seguridad:</h4>
                  <p>
                      No se utilizan mecanismos técnicos para eludir bloqueos, restricciones regionales (geobloqueos) ni sistemas de autenticación de las plataformas externas.
                  </p>

                  <h4 className="font-semibold text-foreground">Cookies y datos del usuario:</h4>
                  <p>
                      Este sitio puede utilizar cookies de terceros para ofrecer una mejor experiencia de usuario, realizar estadísticas anónimas de uso o mostrar anuncios relevantes. Al navegar por Deportes para Todos usted acepta este uso de cookies. Recomendamos consultar las políticas de privacidad de los servicios externos vinculados a este sitio.
                  </p>
                  <p>
                      El contenido patrocinado relacionado con plataformas de iGaming está destinado únicamente a usuarios mayores de 18 años. Deportes para Todos no se responsabiliza por el acceso a dichas plataformas por parte de menores de edad.
                  </p>
                  <p>
                      This Site is affiliated with Monumetric (dba for The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: Publisher Advertising Privacy
                  </p>

                  <h4 className="font-semibold text-foreground">Notificaciones de derechos de autor:</h4>
                  <p>
                      Si usted es titular de derechos o su representante y considera que un contenido embebido desde una fuente externa infringe sus derechos, puede enviarnos una notificación formal mandando un mail a deportesparatodosvercel@gmail.com. Aunque no estamos sujetos a la legislación DMCA de EE.UU., colaboramos voluntariamente con cualquier requerimiento legítimo bajo dicho marco.
                  </p>
                  <p>
                      Por favor incluya en su notificación:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                      <li>(a) Su firma (física o digital) como titular o representante autorizado.</li>
                      <li>(b) Identificación clara del contenido presuntamente infringido.</li>
                      <li>(c) Enlace directo al contenido incrustado en Deportes para Todos.</li>
                      <li>(d) Datos de contacto válidos (correo electrónico).</li>
                      <li>(e) Una declaración de buena fe indicando que el uso no está autorizado por usted, su agente o la ley.</li>
                      <li>(f) Una declaración de veracidad de la información, bajo pena de perjurio.</li>
                  </ul>
                  <p>
                      Una vez recibida y analizada la notificación, procederemos a desactivar el enlace correspondiente si así corresponde. También podremos notificar al proveedor del iframe, si fuera posible.
                  </p>
                  <p>
                      Al utilizar este sitio web, usted declara haber leído, comprendido y aceptado este descargo de responsabilidad en su totalidad.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="w-full flex-grow flex flex-col relative px-4">
        <div className={cn("h-2 w-full absolute top-0 left-0", topBarColorClass)} />
        <div className="flex-grow flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <WelcomeMessage />
            </div>
            <div className="w-full max-w-lg">
              <CameraConfigurationComponent
                numCameras={numCameras}
                setNumCameras={(num) => {
                  setNumCameras(num);
                  setMessages([]);
                  setAcknowledged(false);
                }}
                cameraUrls={cameraUrls}
                setCameraUrls={setCameraUrls}
                messages={messages}
                setMessages={setMessages}
                handleStartView={handleStartView}
                channels={channels}
                channelStatuses={channelStatuses}
                setCameraStatuses={setCameraStatuses}
                setAcknowledged={setAcknowledged}
                isLoadingChannelStatuses={isLoadingStatuses}
                events={processedEvents}
                isLoadingEvents={isLoadingEvents}
                eventsError={eventsError}
                onRefreshEvents={fetchEvents}
                gridGap={gridGap}
                borderColor={borderColor}
                handleGridGapChange={handleGridGapChange}
                handleBorderColorChange={handleBorderColorChange}
                handleRestoreDefaults={handleRestoreDefaults}
                hideBorderConfigButton={true}
                eventGrouping={eventGrouping}
              />
            </div>
        </div>
      </div>
    
    </div>
  );
}
