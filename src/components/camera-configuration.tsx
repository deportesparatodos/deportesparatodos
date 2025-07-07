
"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Tv, ArrowUp, ArrowDown, ChevronDown, X, Settings, RefreshCcw, Search, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ChannelListComponent, type Channel } from './channel-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventListComponent, type Event } from './event-list';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScheduleManager, type ScheduledChange } from './schedule-manager';

export type CameraStatus = 'empty' | 'valid' | 'unknown' | 'inactive';

interface EventGrouping {
    all: boolean;
    enVivo: boolean;
    f1: boolean;
    mlb: boolean;
    nba: boolean;
    mundialDeClubes: boolean;
    deportesDeCombate: boolean;
    liga1: boolean;
    ligaPro: boolean;
    mls: boolean;
    otros: boolean;
}

interface CameraConfigurationProps {
  numCameras: number;
  setNumCameras: (num: number) => void;
  cameraUrls: string[];
  setCameraUrls: Dispatch<SetStateAction<string[]>>;
  messages: string[];
  setMessages: Dispatch<SetStateAction<string[]>>;
  handleStartView: () => void;
  channels: Channel[];
  channelStatuses: Record<string, 'online' | 'offline'>;
  setCameraStatuses: Dispatch<SetStateAction<CameraStatus[]>>;
  setAcknowledged: Dispatch<SetStateAction<boolean>>;
  isLoadingChannelStatuses?: boolean;
  events: Event[];
  isLoadingEvents: boolean;
  eventsError: string | null;
  hideStartButton?: boolean;
  onRefreshEvents?: () => void;
  onReloadCamera?: (index: number) => void;
  gridGap: number;
  borderColor: string;
  handleGridGapChange: (value: number[]) => void;
  handleBorderColorChange: (color: string) => void;
  handleRestoreDefaults: () => void;
  hideBorderConfigButton?: boolean;
  isChatEnabled?: boolean;
  setIsChatEnabled?: (enabled: boolean) => void;
  eventGrouping: EventGrouping;
  setEventGrouping?: Dispatch<SetStateAction<EventGrouping>>;
  scheduledChanges?: ScheduledChange[];
  setScheduledChanges?: Dispatch<SetStateAction<ScheduledChange[]>>;
}

export const CameraConfigurationComponent: FC<CameraConfigurationProps> = ({
  numCameras,
  setNumCameras,
  cameraUrls,
  setCameraUrls,
  messages,
  setMessages,
  handleStartView,
  channels,
  channelStatuses,
  setCameraStatuses,
  setAcknowledged,
  isLoadingChannelStatuses,
  events,
  isLoadingEvents,
  eventsError,
  hideStartButton = false,
  onRefreshEvents,
  onReloadCamera,
  gridGap,
  borderColor,
  handleGridGapChange,
  handleBorderColorChange,
  handleRestoreDefaults,
  hideBorderConfigButton = false,
  isChatEnabled,
  setIsChatEnabled,
  eventGrouping,
  setEventGrouping,
  scheduledChanges,
  setScheduledChanges,
}) => {
  const [dialogOpenForIndex, setDialogOpenForIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleMasterGroupingChange = (checked: boolean) => {
    setEventGrouping?.(prev => ({ ...prev, all: checked }));
  };

  const handleIndividualGroupingChange = (key: 'enVivo' | 'otros' | 'f1' | 'mlb' | 'nba' | 'mundialDeClubes' | 'deportesDeCombate' | 'liga1' | 'ligaPro' | 'mls', checked: boolean) => {
    setEventGrouping?.(prev => ({ ...prev, [key]: checked }));
  };

  const getDisplayStatus = (url: string): { text: string; status: CameraStatus } => {
    if (!url || url.trim() === '') {
        return { text: "Elegir Canal…", status: 'empty' };
    }
    
    const eventUrlMatch = events.flatMap(e => e.options.map((optionUrl, i) => ({ ...e, optionUrl, button: e.buttons[i] })))
                                .find(item => item.optionUrl === url);

    if (eventUrlMatch) {
      return { text: eventUrlMatch.title, status: 'valid' };
    }

    const channelUrlMatch = channels.find(c => c.url === url);
    if(channelUrlMatch) {
      return { text: channelUrlMatch.name.toUpperCase(), status: 'valid' };
    }

    if (url) {
        return { text: "Canal del Usuario", status: 'valid' };
    }

    return { text: "DESCONOCIDO", status: 'unknown' };
  };

  useEffect(() => {
    const statuses = Array.from({ length: numCameras }).map((_, index) => {
        return getDisplayStatus(cameraUrls[index] || '').status;
    });
    setCameraStatuses(statuses);
  }, [cameraUrls, numCameras, setCameraStatuses, channelStatuses, events]);


  const handleNumCamerasChange = (value: string) => {
    setNumCameras(parseInt(value, 10));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = value;
    setCameraUrls(newUrls);
    if (!hideStartButton) {
      setMessages([]);
      setAcknowledged(false);
    }
  };

  const handleClearUrl = (e: React.MouseEvent | React.KeyboardEvent, index: number) => {
    e.stopPropagation();
    handleUrlChange(index, '');
  };

  const handleMoveUrl = (index: number, direction: 'up' | 'down') => {
    const newUrls = [...cameraUrls];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= numCameras) {
      return;
    }

    for (let i = 0; i < numCameras; i++) {
        if (newUrls[i] === undefined) newUrls[i] = '';
    }

    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    setCameraUrls(newUrls);
    if (!hideStartButton) {
      setMessages([]);
      setAcknowledged(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hideStartButton) {
      handleStartView();
    }
  };
  
  const handleSelectChannel = async (url: string) => {
    if (dialogOpenForIndex !== null) {
      handleUrlChange(dialogOpenForIndex, url);
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        console.error("Failed to copy URL to clipboard:", err);
      }
      setDialogOpenForIndex(null); // Close dialog
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="w-full space-y-4">
            {!hideBorderConfigButton && setEventGrouping && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg flex flex-col p-0 max-h-[90vh]">
                <DialogHeader className="p-4 py-3 border-b shrink-0">
                    <DialogTitle>Configuración:</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto p-4 flex-grow">
                  <Accordion type="multiple" className="w-full space-y-4" defaultValue={[]}>
                    <AccordionItem value="item-1" className="border rounded-md px-1">
                      <AccordionTrigger className="p-3 hover:no-underline">Bordes</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-2 px-3 pb-3">
                          <div className="space-y-2">
                              <Label htmlFor="grid-gap-slider-view">Tamaño de Bordes ({gridGap}px)</Label>
                              <Slider
                                  id="grid-gap-slider-view"
                                  min={0}
                                  max={32}
                                  step={1}
                                  value={[gridGap]}
                                  onValueChange={handleGridGapChange}
                              />
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="border-color-input-view">Color de Bordes</Label>
                              <div className="flex items-center gap-2">
                                  <Input
                                      id="border-color-input-view"
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
                    {isChatEnabled !== undefined && setIsChatEnabled && (
                      <AccordionItem value="item-2" className="border rounded-md px-1">
                        <AccordionTrigger className="p-3 hover:no-underline">Chat</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-6 pt-2 px-3 pb-3">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="chat-switch-view" className="text-base">Activar Chat en Vivo</Label>
                                <p className="text-sm text-muted-foreground">
                                  Muestra el botón para abrir el chat en la vista.
                                </p>
                              </div>
                              <Switch
                                id="chat-switch-view"
                                checked={isChatEnabled}
                                onCheckedChange={setIsChatEnabled}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    <AccordionItem value="item-3" className="border-b-0 border rounded-md px-1">
                      <AccordionTrigger className="p-3 hover:no-underline">Eventos</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-2 px-3 pb-3">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label htmlFor="group-all-switch-view" className="text-base">Agrupar todos los eventos</Label>
                              <p className="text-sm text-muted-foreground">Activa o desactiva todas las agrupaciones.</p>
                            </div>
                            <Switch
                              id="group-all-switch-view"
                              checked={eventGrouping.all}
                              onCheckedChange={handleMasterGroupingChange}
                            />
                          </div>

                          <div className={cn("space-y-4 rounded-lg border p-4", !eventGrouping.all && "opacity-50 pointer-events-none")}>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-enVivo-switch-view" className="text-base">Agrupar "En Vivo"</Label>
                                <Switch
                                  id="group-enVivo-switch-view"
                                  checked={eventGrouping.enVivo}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('enVivo', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                              <Separator/>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="group-otros-switch-view" className="text-base">Agrupar "Otros"</Label>
                                <Switch
                                  id="group-otros-switch-view"
                                  checked={eventGrouping.otros}
                                  onCheckedChange={(checked) => handleIndividualGroupingChange('otros', checked)}
                                  disabled={!eventGrouping.all}
                                />
                              </div>
                          </div>

                          <div className={cn("space-y-4 rounded-lg border p-4", !eventGrouping.all && "opacity-50 pointer-events-none")}>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-f1-switch-view" className="text-base">Agrupar F1</Label>
                              <Switch
                                id="group-f1-switch-view"
                                checked={eventGrouping.f1}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('f1', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-mlb-switch-view" className="text-base">Agrupar MLB</Label>
                              <Switch
                                id="group-mlb-switch-view"
                                checked={eventGrouping.mlb}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('mlb', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-nba-switch-view" className="text-base">Agrupar NBA</Label>
                              <Switch
                                id="group-nba-switch-view"
                                checked={eventGrouping.nba}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('nba', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-mundial-switch-view" className="text-base">Agrupar Mundial de Clubes</Label>
                              <Switch
                                id="group-mundial-switch-view"
                                checked={eventGrouping.mundialDeClubes}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('mundialDeClubes', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-combate-switch-view" className="text-base">Agrupar Deportes de Combate</Label>
                              <Switch
                                id="group-combate-switch-view"
                                checked={eventGrouping.deportesDeCombate}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('deportesDeCombate', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-liga1-switch-view" className="text-base">Agrupar LIGA1</Label>
                              <Switch
                                id="group-liga1-switch-view"
                                checked={eventGrouping.liga1}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('liga1', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-ligapro-switch-view" className="text-base">Agrupar Liga Pro</Label>
                              <Switch
                                id="group-ligapro-switch-view"
                                checked={eventGrouping.ligaPro}
                                onCheckedChange={(checked) => handleIndividualGroupingChange('ligaPro', checked)}
                                disabled={!eventGrouping.all}
                              />
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="group-mls-switch-view" className="text-base">Agrupar MLS</Label>
                              <Switch
                                id="group-mls-switch-view"
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
            )}
            <Select onValueChange={handleNumCamerasChange} value={numCameras.toString()}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar cantidad de ventanas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1 VENTANA</SelectItem>
                    <SelectItem value="2">2 VENTANAS</SelectItem>
                    <SelectItem value="3">3 VENTANAS</SelectItem>
                    <SelectItem value="4">4 VENTANAS</SelectItem>
                    <SelectItem value="6">6 VENTANAS</SelectItem>
                    <SelectItem value="9">9 VENTANAS</SelectItem>
                </SelectContent>
            </Select>

          <div className="space-y-3">
          {Array.from({ length: numCameras }).map((_, index) => {
            const displayStatus = getDisplayStatus(cameraUrls[index] || '');
            const hasContent = !!(cameraUrls[index] && cameraUrls[index].trim() !== '');

            return (
              <div key={index} className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveUrl(index, 'up')}
                    disabled={index === 0}
                    aria-label="Mover URL hacia arriba"
                    className="bg-background hover:bg-accent/50"
                    type="button" 
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                
                <Dialog open={dialogOpenForIndex === index} onOpenChange={(isOpen) => {
                  setDialogOpenForIndex(isOpen ? index : null);
                  if (!isOpen) setSearchTerm('');
                }}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="relative flex-grow justify-between items-center overflow-hidden w-0"
                      aria-label={`Seleccionar entrada para Vista ${index + 1}`}
                    >
                      <span className={cn(
                        "truncate text-left",
                         {
                          'text-green-600 dark:text-green-400': displayStatus.status === 'valid',
                          'text-muted-foreground': displayStatus.status === 'empty',
                          'text-red-600 dark:text-red-500': displayStatus.status === 'inactive' || displayStatus.status === 'unknown'
                         }
                      )}>
                        {displayStatus.text}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasContent && (
                           <span
                              role="button"
                              aria-label="Limpiar entrada"
                              tabIndex={0}
                              onClick={(e) => handleClearUrl(e, index)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClearUrl(e, index); } }}
                              className="p-1 rounded-full hover:bg-muted z-10"
                           >
                              <X className="h-4 w-4 opacity-50 flex-shrink-0 hover:opacity-100" />
                           </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                      <DialogHeader className="p-4 border-b">
                          <DialogTitle>Seleccionar una entrada para la Vista {index + 1}</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="channels" className="w-full flex-grow flex flex-col overflow-hidden px-4 pb-4 pt-2">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="channels">Canales</TabsTrigger>
                              <TabsTrigger value="events">Eventos</TabsTrigger>
                          </TabsList>
                          <TabsContent value="channels" className="flex-grow flex flex-col overflow-hidden mt-4 data-[state=inactive]:hidden">
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                      type="text"
                                      placeholder="Buscar canal..."
                                      className="h-9 w-full pl-10 pr-8"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                  {searchTerm && (
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                          onClick={() => setSearchTerm('')}
                                      >
                                          <X className="h-4 w-4" />
                                      </Button>
                                  )}
                              </div>
                              <div className="flex-grow overflow-y-auto mt-4">
                                  <ChannelListComponent 
                                      channelStatuses={channelStatuses}
                                      isLoading={isLoadingChannelStatuses || false}
                                      onSelectChannel={handleSelectChannel}
                                      searchTerm={searchTerm}
                                  />
                              </div>
                          </TabsContent>
                          <TabsContent value="events" className="flex-grow flex flex-col overflow-hidden mt-2 data-[state=inactive]:hidden">
                               <div className="flex items-center gap-2">
                                  <div className="relative flex-grow">
                                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                          type="text"
                                          placeholder="Buscar evento..."
                                          className="h-9 w-full pl-10 pr-8"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                      />
                                      {searchTerm && (
                                          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setSearchTerm('')}>
                                              <X className="h-4 w-4" />
                                          </Button>
                                      )}
                                  </div>
                                  {onRefreshEvents && (
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-9 w-9 flex-shrink-0"
                                          onClick={onRefreshEvents}
                                          disabled={isLoadingEvents}
                                      >
                                          <span className="sr-only">Actualizar eventos</span>
                                          {isLoadingEvents ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                      </Button>
                                  )}
                              </div>
                              <p className="text-xs text-center text-muted-foreground pt-2">
                                  Puede modificar la agrupación de eventos en el menú de configuración.
                              </p>
                              <Separator className="mt-2 mb-0.5" />
                              <div className="flex-grow overflow-y-auto pt-[16px]">
                                  <EventListComponent 
                                      onSelectEvent={handleSelectChannel}
                                      events={events}
                                      isLoading={isLoadingEvents}
                                      error={eventsError}
                                      eventGrouping={eventGrouping}
                                      searchTerm={searchTerm}
                                  />
                              </div>
                          </TabsContent>
                      </Tabs>
                  </DialogContent>
                </Dialog>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveUrl(index, 'down')}
                    disabled={index === numCameras - 1}
                    aria-label="Mover URL hacia abajo"
                    className="bg-background hover:bg-accent/50"
                    type="button"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
                
                {onReloadCamera && hasContent && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onReloadCamera(index)}
                    aria-label="Recargar vista"
                    className="bg-background hover:bg-accent/50"
                    type="button"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
          </div>

          {hideStartButton && scheduledChanges !== undefined && setScheduledChanges && (
            <ScheduleManager 
                scheduledChanges={scheduledChanges}
                setScheduledChanges={setScheduledChanges}
                numCameras={numCameras}
                channels={channels}
                events={events}
                channelStatuses={channelStatuses}
                isLoadingChannels={isLoadingChannelStatuses || false}
                isLoadingEvents={isLoadingEvents}
                eventGrouping={eventGrouping}
            />
          )}

          {!hideStartButton && messages && messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((text, index) => (
                <div key={index} className={cn(
                  "flex items-center p-3 text-sm rounded-md border",
                  "bg-destructive/10 text-destructive border-destructive/30",
                )}>
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>{text}</p>
                </div>
              ))}
            </div>
          )}
        
          {!hideStartButton && (
            <div className="space-y-2 pt-1">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Tv className="mr-2 h-4 w-4" /> Iniciar Vista
              </Button>
              <p className="text-center text-xs text-muted-foreground px-2">
                  Ante posibles errores, problemas legales o si no sabe como proceder, puede visitar el menú principal para despejar sus dudas.
              </p>
            </div>
          )}
      </form>
    </>
  );
};
