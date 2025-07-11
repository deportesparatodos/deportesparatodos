
'use client';

import { useState, type FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Plus, Save, Search, Trash2, ArrowUp, ArrowDown, X, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { ChannelListComponent, type Channel } from './channel-list';
import { EventListComponent, type Event } from './event-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


// Exporting the type for use in other components
export interface ScheduledLayoutChange {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  numCameras: number;
  urls: string[];
  names: string[];
}

// Copied from camera-configuration.tsx to avoid dependency issues
interface EventGrouping {
    all: boolean;
    enVivo: boolean;
    f1: boolean;
    mlb: boolean;
    nba: boolean;
    mundialDeClubes: boolean;
    deportesDeCombate: boolean;
    deportesDeMotor: boolean;
    liga1: boolean;
    ligaPro: boolean;
    mls: boolean;
    otros: boolean;
}

interface ScheduleManagerProps {
  scheduledChanges: ScheduledLayoutChange[];
  setScheduledChanges: (changes: ScheduledLayoutChange[]) => void;
  numCameras: number;
  cameraUrls: string[];
  channels: Channel[];
  events: Event[];
  channelStatuses: Record<string, 'online' | 'offline'>;
  isLoadingChannels: boolean;
  isLoadingEvents: boolean;
  eventGrouping: EventGrouping;
}

export const ScheduleManager: FC<ScheduleManagerProps> = ({
  scheduledChanges,
  setScheduledChanges,
  numCameras,
  cameraUrls,
  channels,
  events,
  channelStatuses,
  isLoadingChannels,
  isLoadingEvents,
  eventGrouping,
}) => {
  const [open, setOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<Omit<ScheduledLayoutChange, 'id'> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<{ open: boolean; viewIndex: number | null }>({ open: false, viewIndex: null });
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    // Clean up past events when the dialog is opened
    if (open) {
        const now = new Date();
        const upcomingChanges = scheduledChanges.filter(change => {
            if (!change.date || !change.time) return false;
            const scheduledDateTime = new Date(`${change.date}T${change.time}`);
            return scheduledDateTime >= now;
        });

        if (upcomingChanges.length !== scheduledChanges.length) {
            setScheduledChanges(upcomingChanges);
        }
    }
  }, [open, scheduledChanges, setScheduledChanges]);
  
  const getChannelOrEventName = (url: string): string => {
    if (!url) return "Elegir Canal…";
    const eventMatch = events.flatMap(e => e.options.map((optionUrl, i) => ({ ...e, optionUrl, button: e.buttons[i] }))).find(item => item.optionUrl === url);
    if (eventMatch) {
        return eventMatch.title;
    }
    const channel = channels.find(c => c.url === url);
    if (channel) {
        return channel.name.toUpperCase();
    }
    return "Enlace Personalizado";
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setEditingChange({
        time: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        numCameras: numCameras,
        urls: [...cameraUrls],
        names: cameraUrls.map(url => getChannelOrEventName(url))
    });
  };

  const handleEditClick = (change: ScheduledLayoutChange) => {
    setEditingId(change.id);
    const fullUrls = Array(9).fill('');
    const fullNames = Array(9).fill('');
    change.urls.forEach((url, i) => fullUrls[i] = url);
    change.names.forEach((name, i) => fullNames[i] = name);

    setEditingChange({
        time: change.time,
        date: change.date || format(new Date(), 'yyyy-MM-dd'),
        numCameras: change.numCameras,
        urls: fullUrls,
        names: fullNames,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingChange(null);
  }
  
  const handleSaveChange = () => {
    if (!editingChange || !editingChange.time || !editingChange.date || !editingChange.numCameras) {
        return;
    }

    const changeToSave: ScheduledLayoutChange = {
        id: editingId || crypto.randomUUID(),
        date: editingChange.date,
        time: editingChange.time,
        numCameras: editingChange.numCameras,
        urls: editingChange.urls.slice(0, editingChange.numCameras),
        names: editingChange.names.slice(0, editingChange.numCameras),
    };

    if (editingId) {
        setScheduledChanges(
            scheduledChanges.map((change) =>
                change.id === editingId ? changeToSave : change
            )
        );
    } else {
        setScheduledChanges([...scheduledChanges, changeToSave]);
    }
    
    handleCancelEdit();
  };

  const handleRemoveChange = (id: string) => {
    setScheduledChanges(scheduledChanges.filter((change) => change.id !== id));
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleFormNumCamerasChange = (value: string) => {
    const num = parseInt(value, 10);
    setEditingChange(prev => prev ? { ...prev, numCameras: num } : null);
  };

  const handleMoveUrl = (index: number, direction: 'up' | 'down') => {
    if (!editingChange) return;

    const newUrls = [...editingChange.urls];
    const newNames = [...editingChange.names];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= editingChange.numCameras) {
        return;
    }

    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    [newNames[index], newNames[targetIndex]] = [newNames[targetIndex], newNames[index]];

    setEditingChange({
        ...editingChange,
        urls: newUrls,
        names: newNames,
    });
  };
  
  const handleOpenPicker = (index: number) => {
    setPickerState({ open: true, viewIndex: index });
  };
  
  const handleSelectContent = (url: string) => {
    if (pickerState.viewIndex === null || !editingChange) return;

    const name = getChannelOrEventName(url);
    const index = pickerState.viewIndex;

    const newUrls = [...editingChange.urls];
    const newNames = [...editingChange.names];
    newUrls[index] = url;
    newNames[index] = name;
    
    setEditingChange({ ...editingChange, urls: newUrls, names: newNames });
    setPickerState({ open: false, viewIndex: null });
    setSearchTerm('');
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full max-w-xl mx-auto">
          <Clock className="mr-2 h-4 w-4" />
          Programar Selección
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Programar Diseños</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-6 p-4">
          <div className="w-full md:w-2/5 flex flex-col">
            <Button onClick={handleAddNewClick} className="mb-4 w-full max-w-xl mx-auto">
              <Plus className="mr-2 h-4 w-4" />
              Programar Nuevo Diseño
            </Button>
            <ScrollArea className="flex-grow pr-2 -mr-2">
              <div className="space-y-2">
                {scheduledChanges.length > 0 ? (
                  scheduledChanges
                    .sort((a,b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
                    .map((change) => (
                      <div
                        key={change.id}
                        className="relative p-3 rounded-md transition-colors bg-muted w-full max-w-xl mx-auto cursor-pointer"
                        onClick={() => handleEditClick(change)}
                      >
                         <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveChange(change.id);
                            }}
                            aria-label="Eliminar cambio programado"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="pr-10 text-center">
                            <p className="font-bold text-lg">{change.date ? format(new Date(change.date + 'T00:00:00'), 'EEE, dd MMM', { locale: es }) : ''} - {change.time}</p>
                            <p className="text-sm text-muted-foreground">Cantidad de Ventanas: {change.numCameras}</p>
                          </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No hay diseños programados.</p>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="w-full md:w-3/5 flex flex-col border-t md:border-t-0 md:border-l md:border-border pt-6 md:pt-0 md:pl-6">
            {editingChange ? (
                <>
                <ScrollArea className="flex-grow pr-2 -mr-2">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className='space-y-2'>
                              <Label htmlFor="schedule-date">Fecha:</Label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button
                                          id="schedule-date"
                                          variant={"outline"}
                                          className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !editingChange.date && "text-muted-foreground"
                                          )}
                                      >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {editingChange.date ? format(new Date(editingChange.date + 'T00:00:00'), "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-background">
                                      <Calendar
                                          mode="single"
                                          selected={editingChange.date ? new Date(editingChange.date + 'T00:00:00') : undefined}
                                          onSelect={(day) =>
                                              setEditingChange(prev => prev ? { ...prev, date: day ? format(day, 'yyyy-MM-dd') : '' } : null)
                                          }
                                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                          initialFocus
                                      />
                                  </PopoverContent>
                              </Popover>
                          </div>
                          <div className='space-y-2'>
                              <Label htmlFor="schedule-time">Hora:</Label>
                              <input
                                  id="schedule-time"
                                  type="time"
                                  value={editingChange.time || ''}
                                  onChange={e => setEditingChange(prev => prev ? { ...prev, time: e.target.value } : null)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="schedule-num-cameras">Configurar Vista:</Label>
                          <Select onValueChange={handleFormNumCamerasChange} value={String(editingChange.numCameras)}>
                              <SelectTrigger id="schedule-num-cameras">
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
                        </div>
                        
                        {Array.from({ length: editingChange.numCameras }).map((_, index) => (
                           <div key={index} className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleMoveUrl(index, 'up')}
                                    disabled={index === 0}
                                    aria-label="Mover hacia arriba"
                                    className="bg-background hover:bg-accent/50"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="relative flex-grow justify-between items-center overflow-hidden w-0"
                                onClick={() => handleOpenPicker(index)}
                              >
                                <span className="whitespace-normal text-left text-sm">{editingChange.names[index] || "Elegir Canal…"}</span>
                                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                              </Button>
                               <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleMoveUrl(index, 'down')}
                                    disabled={index === editingChange.numCameras - 1}
                                    aria-label="Mover hacia abajo"
                                    className="bg-background hover:bg-accent/50"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                           </div>
                        ))}
                    </div>
                </ScrollArea>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={handleSaveChange}>
                        <Save className="mr-2 h-4 w-4" /> Guardar
                    </Button>
                     <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                    </Button>
                </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">Seleccione un diseño para editar o cree uno nuevo.</p>
                </div>
            )}
          </div>
        </div>

        <Dialog open={pickerState.open} onOpenChange={(isOpen) => setPickerState(prev => ({...prev, open: isOpen}))}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle>Seleccionar para Vista {pickerState.viewIndex !== null ? pickerState.viewIndex + 1 : ''}</DialogTitle>
              </DialogHeader>
                <Tabs defaultValue="channels" className="w-full flex-grow flex flex-col overflow-hidden px-4 pb-4 pt-2">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="channels">Canales</TabsTrigger>
                      <TabsTrigger value="events">Eventos</TabsTrigger>
                  </TabsList>
                  <div className="relative my-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        className="h-9 w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <TabsContent value="channels" className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
                      <ScrollArea>
                          <ChannelListComponent 
                              channelStatuses={channelStatuses}
                              isLoading={isLoadingChannels}
                              onSelectChannel={handleSelectContent}
                              searchTerm={searchTerm}
                          />
                      </ScrollArea>
                  </TabsContent>
                  <TabsContent value="events" className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
                      <ScrollArea>
                          <EventListComponent 
                              onSelectEvent={handleSelectContent}
                              events={events}
                              isLoading={isLoadingEvents}
                              error={null}
                              eventGrouping={eventGrouping}
                              searchTerm={searchTerm}
                          />
                      </ScrollArea>
                  </TabsContent>
                </Tabs>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
