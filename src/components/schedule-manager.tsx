
'use client';

import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Plus, Save, Search, Trash2 } from 'lucide-react';
import { ChannelListComponent, type Channel } from './channel-list';
import { EventListComponent, type Event } from './event-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Exporting the type for use in other components
export interface ScheduledChange {
  id: string;
  time: string; // HH:mm format
  viewIndex: number; // 0-based index
  url: string;
  name: string;
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
    liga1: boolean;
    ligaPro: boolean;
    mls: boolean;
    otros: boolean;
}

interface ScheduleManagerProps {
  scheduledChanges: ScheduledChange[];
  setScheduledChanges: (changes: ScheduledChange[]) => void;
  numCameras: number;
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
  channels,
  events,
  channelStatuses,
  isLoadingChannels,
  isLoadingEvents,
  eventGrouping,
}) => {
  const [open, setOpen] = useState(false);
  const [newChange, setNewChange] = useState<{ time: string; viewIndex: number | null; url: string; name: string } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const getChannelOrEventName = (url: string): string => {
    const event = events.find(e => e.options.includes(url));
    if (event) {
        return event.title;
    }

    const channel = channels.find(c => c.url === url);
    if (channel) {
        return channel.name.toUpperCase();
    }

    return "Enlace Personalizado";
  };
  
  const handleSelectContent = (url: string) => {
    const name = getChannelOrEventName(url);
    setNewChange(prev => ({ ...(prev || { time: '', viewIndex: null, url: '', name: '' }), url, name }));
    setIsPickerOpen(false);
    setSearchTerm('');
  };

  const handleAddOrUpdateChange = () => {
    if (!newChange || !newChange.time || newChange.viewIndex === null || !newChange.url) {
      return;
    }

    if (editingId) {
      // Update existing change
      setScheduledChanges(
        scheduledChanges.map((change) =>
          change.id === editingId
            ? { ...change, ...newChange, id: editingId }
            : change
        )
      );
    } else {
      // Add new change
      setScheduledChanges([
        ...scheduledChanges,
        { ...newChange, id: crypto.randomUUID(), viewIndex: newChange.viewIndex! },
      ]);
    }
    // Reset form state
    setNewChange(null);
    setEditingId(null);
  };

  const handleRemoveChange = (id: string) => {
    setScheduledChanges(scheduledChanges.filter((change) => change.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewChange(null);
    }
  };

  const handleEditClick = (change: ScheduledChange) => {
    setEditingId(change.id);
    setNewChange({
      time: change.time,
      viewIndex: change.viewIndex,
      url: change.url,
      name: change.name,
    });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewChange(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Clock className="mr-2 h-4 w-4" />
          Programar Selección
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Programar Cambios</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-hidden flex flex-col sm:flex-row gap-4 p-4">
          {/* Left Side: List of scheduled changes */}
          <div className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r pb-4 sm:pb-0 sm:pr-4">
            <h3 className="text-lg font-semibold mb-2">Programados</h3>
            <ScrollArea className="flex-grow pr-2">
              <div className="space-y-2">
                {scheduledChanges.length > 0 ? (
                  scheduledChanges
                    .sort((a,b) => a.time.localeCompare(b.time))
                    .map((change) => (
                      <div key={change.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm group">
                        <div 
                          className="flex flex-col flex-grow overflow-hidden mr-2 cursor-pointer"
                          onClick={() => handleEditClick(change)}
                        >
                          <span className="font-bold">{change.time}</span>
                          <span className="text-xs text-muted-foreground truncate group-hover:underline">
                            Ventana {change.viewIndex + 1}: {change.name}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8" onClick={() => handleRemoveChange(change.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No hay cambios programados.</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Side: Add new change */}
          <div className="w-full sm:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                    {editingId ? 'Editando Cambio' : 'Agregar Nuevo'}
                </h3>
                {editingId && (
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancelar
                    </Button>
                )}
            </div>
             <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-time">Hora (24hs)</Label>
                  <Input 
                    id="schedule-time" 
                    type="time" 
                    value={newChange?.time || ''}
                    onChange={e => setNewChange(prev => ({...(prev || { url: '', name: '', viewIndex: null }), time: e.target.value}))}
                  />
                </div>
                 <div>
                  <Label htmlFor="schedule-view">Ventana</Label>
                  <Select
                    value={newChange?.viewIndex !== null && newChange?.viewIndex !== undefined ? String(newChange.viewIndex) : ''}
                    onValueChange={value => setNewChange(prev => ({...(prev || { url: '', name: '', time: ''}), viewIndex: parseInt(value, 10)}))}
                  >
                    <SelectTrigger id="schedule-view">
                      <SelectValue placeholder="Seleccionar ventana..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: numCameras }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          Ventana {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label>Canal / Evento</Label>
                    <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal truncate">
                                {newChange?.name || "Seleccionar contenido..."}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                             <DialogHeader className="p-4 border-b">
                                <DialogTitle>Seleccionar un Canal o Evento</DialogTitle>
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
                </div>
             </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t shrink-0">
          <Button onClick={handleAddOrUpdateChange} disabled={!newChange || !newChange.time || newChange.viewIndex === null || !newChange.url}>
             {editingId ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Actualizar Cambio
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Agregar a la Lista
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
