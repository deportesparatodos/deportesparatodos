

'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Plus, Pencil, Maximize, Minimize, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogPortal,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from './ui/label';
import type { Event } from './event-carousel';
import { EventList } from './layout-configurator';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import type { Channel } from './channel-list';
import { EventSelectionDialog } from './event-selection-dialog';
import { AddEventsDialog } from './add-events-dialog';
import { useToast } from '@/hooks/use-toast';

export interface Schedule {
  id: string;
  dateTime: Date;
  events: (Event | null)[];
  order: number[];
}

interface ScheduleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
  isLoading: boolean;
  initialSelection: (Event | null)[];
  initialOrder: number[];
  allEvents: Event[];
  allChannels: Channel[];
  getEventSelection: (event: Event) => { isSelected: boolean; selectedOption: string | null; index: number };
  container?: HTMLElement;
}

export function ScheduleManager({
  open,
  onOpenChange,
  schedules,
  onSchedulesChange,
  isLoading,
  initialSelection,
  initialOrder,
  allEvents,
  allChannels,
  getEventSelection,
  container,
}: ScheduleManagerProps) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // This state is now fully managed INSIDE the ScheduleManager
  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
  const [futureOrder, setFutureOrder] = useState<number[]>([]);

  // Dialog states are also local to this component
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [eventSelectionDialogOpen, setEventSelectionDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const { toast } = useToast();

  const resetToCurrentSelection = () => {
    setFutureSelection([...initialSelection]);
    const activeCurrentOrder = initialOrder.filter(i => initialSelection[i] !== null);
    const fullOrder = Array.from({ length: 9 }, (_, i) => i);
    const finalOrder = [...activeCurrentOrder, ...fullOrder.filter(i => !activeCurrentOrder.includes(i))];
    setFutureOrder(finalOrder);
    setDate(new Date());
    setTime(format(new Date(), 'HH:mm'));
    setEditingScheduleId(null);
  };
  
  useEffect(() => {
    if (open) {
      resetToCurrentSelection();
      setIsFullScreen(true); // Default to fullscreen
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSelection, initialOrder]);

  const handleSaveOrUpdateSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const activeOrder = futureOrder.filter(i => futureSelection[i] !== null);

    if (editingScheduleId) {
      const updatedSchedules = schedules.map(s => 
        s.id === editingScheduleId 
          ? { ...s, dateTime: combinedDateTime, events: futureSelection, order: activeOrder }
          : s
      );
      onSchedulesChange(updatedSchedules);
    } else {
      const newSchedule: Schedule = {
        id: new Date().toISOString(),
        dateTime: combinedDateTime,
        events: futureSelection,
        order: activeOrder,
      };
      onSchedulesChange([...schedules, newSchedule]);
    }
    
    resetToCurrentSelection();
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setDate(new Date(schedule.dateTime));
    setTime(format(new Date(schedule.dateTime), 'HH:mm'));
    setFutureSelection([...schedule.events]);
    
    const fullOrder = Array.from({ length: 9 }, (_, i) => i);
    const finalOrder = [...schedule.order, ...fullOrder.filter(i => !schedule.order.includes(i))];
    setFutureOrder(finalOrder);
  };

  const handleRemoveSchedule = (id: string) => {
    onSchedulesChange(schedules.filter(s => s.id !== id));
    if (editingScheduleId === id) {
       resetToCurrentSelection();
    }
  };
  
  const handleRemoveEventFromFuture = (indexToRemove: number) => {
    const newSelection = [...futureSelection];
    newSelection[indexToRemove] = null;
    setFutureSelection(newSelection);
  };
  
  const handleOrderChangeInFuture = (newOrder: number[]) => {
    if(newOrder) {
      const fullNewOrder = [...newOrder];
      const presentIndexes = new Set(newOrder);
      for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
          fullNewOrder.push(i);
        }
      }
      setFutureOrder(fullNewOrder);
    }
  };

  // This function opens the selection dialog for an event to be added to the schedule.
  const openDialogForEventSchedule = async (event: Event) => {
    const selectionIndex = futureSelection.findIndex(se => se?.id === event.id);
    let eventForDialog = { ...event };
    
    if (selectionIndex !== -1) {
        setModificationIndex(selectionIndex);
        if (futureSelection[selectionIndex]?.selectedOption) {
            eventForDialog.selectedOption = futureSelection[selectionIndex]?.selectedOption;
        }
    } else {
        const emptyIndex = futureSelection.findIndex(e => e === null);
        if (emptyIndex === -1) {
            toast({ variant: 'destructive', title: "Programación llena", description: "No puedes programar más de 9 eventos."});
            return;
        }
        setModificationIndex(emptyIndex);
    }

    setDialogEvent(eventForDialog);
    setEventSelectionDialogOpen(true); // Open the selection dialog

    if (event.source !== 'streamed.pk' || event.options.length > 0) return;
    
    setIsOptionsLoading(true);
    try {
      const sourcePromises = event.sources.map(async (source) => {
        const response = await fetch(`/api/streams?type=stream&source=${source.source}&id=${source.id}`);
        if (response.ok) {
          const streams: any[] = await response.json();
          return streams.map((stream) => ({ url: stream.embedUrl, label: `${stream.language}${stream.hd ? ' HD' : ''} (${stream.source})`, hd: stream.hd, language: stream.language, }));
        }
        return [];
      });
      const results = await Promise.all(sourcePromises);
      const streamOptions = results.flat().filter(Boolean);
      setDialogEvent({ ...eventForDialog, options: streamOptions });
    } finally {
        setIsOptionsLoading(false);
    }
  };
  
  const handleSelectChannelForSchedule = (channel: Channel) => {
      const channelAsEvent: Event = {
          id: `${channel.name}-channel-static-schedule`,
          title: channel.name,
          options: channel.urls.map(u => ({...u, hd: false, language: ''})),
          sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo
      };
      openDialogForEventSchedule(channelAsEvent);
  };

  // This is the crucial part: this function ONLY modifies the schedule's state
  // and does NOT close the AddEventsDialog.
  const handleFinalSelectionForSchedule = (event: Event, optionUrl: string) => {
      const newFutureSelection = [...futureSelection];
      if (modificationIndex !== null) {
          newFutureSelection[modificationIndex] = { ...event, selectedOption: optionUrl };
          setFutureSelection(newFutureSelection);
      }
      setEventSelectionDialogOpen(false); // Close only the inner dialog
      setModificationIndex(null);
  };
  
  const activeFutureEventsCount = futureOrder?.filter(i => futureSelection[i] !== null).length ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal container={container}>
          <DialogContent 
              hideClose={true}
              className={cn(
                  "max-w-4xl h-[90vh] flex flex-col p-0 transition-all duration-300",
                   isFullScreen && "w-screen h-screen max-w-none rounded-none"
              )}
          >
            <DialogHeader className="p-4 border-b flex-shrink-0 flex-row items-center justify-between">
              <div>
                <DialogTitle>Programar Selección</DialogTitle>
                <DialogDescription>
                  Configura o modifica una selección de eventos para que se activen en un momento específico.
                </DialogDescription>
              </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="h-9 w-9">
                      {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-9 w-9">
                      <X className="h-5 w-5" />
                  </Button>
              </div>
            </DialogHeader>

            <div className="grid md:grid-cols-2 flex-grow h-0 overflow-hidden">
                <div className="flex flex-col border-r border-border">
                     <h3 className="px-4 py-2 text-lg font-semibold flex-shrink-0">Programaciones Activas</h3>
                     <Separator className="w-full flex-shrink-0" />
                     <ScrollArea className="flex-grow h-0">
                        <div className="p-4 space-y-3">
                        {schedules.length === 0 ? (
                            <p className="text-muted-foreground text-center p-4">No hay programaciones.</p>
                        ) : (
                            schedules
                                .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                                .map((schedule) => (
                                    <div key={schedule.id} className="flex items-center justify-between p-3 rounded-md border bg-secondary">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{format(schedule.dateTime, 'EEE, d MMM, p')}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            Eventos: {schedule.events.filter(Boolean).length}
                                        </p>
                                    </div>
                                    <div className="flex items-center flex-shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditSchedule(schedule)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveSchedule(schedule.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    </div>
                                ))
                        )}
                        </div>
                     </ScrollArea>
                </div>
                
                <div className="flex flex-col">
                     <div className='flex justify-between items-center px-4 py-2 flex-shrink-0'>
                       <h3 className="text-lg font-semibold">
                         {editingScheduleId ? 'Editando Programación' : 'Nueva Programación'}
                       </h3>
                       {editingScheduleId && (
                          <Button variant="outline" size="sm" onClick={resetToCurrentSelection}>Crear Nueva</Button>
                       )}
                     </div>
                     <Separator className="w-full flex-shrink-0" />
                     <div className="p-4 border-b border-border space-y-2 flex-shrink-0">
                        <div className="grid grid-cols-2 gap-4">
                          <Label htmlFor='date-picker'>Fecha</Label>
                          <Label htmlFor='time-picker'>Hora</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date-picker"
                                variant={'outline'}
                                className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, 'PPP') : <span>Elige una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                            </Popover>
                            <Input
                              id="time-picker"
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="w-full"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-grow h-0">
                        <div className="p-4">
                            <EventList
                                order={futureOrder ? futureOrder.filter(i => futureSelection[i] !== null) : []}
                                onOrderChange={handleOrderChangeInFuture}
                                eventDetails={futureSelection}
                                onRemove={handleRemoveEventFromFuture}
                                onModify={(index: number) => {
                                  const eventToModify = futureSelection[index];
                                  if (eventToModify) {
                                    openDialogForEventSchedule(eventToModify);
                                  }
                                }}
                                isViewPage={true}
                            />
                        </div>
                    </ScrollArea>
                     <div className="p-4 border-t border-border mt-auto flex-shrink-0 space-y-2">
                        <Button variant="outline" className="w-full" onClick={() => setAddEventsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4"/> Añadir Evento/Canal a Programación
                        </Button>
                        <Button className="w-full" onClick={handleSaveOrUpdateSchedule} disabled={activeFutureEventsCount === 0}>
                            {editingScheduleId ? 'Actualizar Programación' : 'Guardar Programación'}
                        </Button>
                     </div>
                </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
      
      {/* Dialogs are now managed locally and passed the correct functions */}
      <AddEventsDialog
        open={addEventsDialogOpen}
        onOpenChange={setAddEventsDialogOpen}
        onEventSelect={openDialogForEventSchedule}
        onChannelClick={handleSelectChannelForSchedule}
        getEventSelection={(event) => {
          const selectionIndex = futureSelection.findIndex(se => se?.id === event.id);
          if (selectionIndex !== -1) {
            return { isSelected: true, selectedOption: futureSelection[selectionIndex]?.selectedOption || null, index: selectionIndex };
          }
          return { isSelected: false, selectedOption: null, index: -1 };
        }}
        events={allEvents}
        channels={allChannels}
        isLoading={isLoading}
        onFetch={() => {}} // No fetch needed here
        container={container}
      />
      
      {dialogEvent && (
        <EventSelectionDialog
          isOpen={eventSelectionDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setModificationIndex(null);
            setEventSelectionDialogOpen(isOpen)
          }}
          event={dialogEvent}
          onSelect={handleFinalSelectionForSchedule}
          isModification={modificationIndex !== null}
          modificationIndex={modificationIndex}
          onRemove={(index) => {
            handleRemoveEventFromFuture(index);
            setEventSelectionDialogOpen(false);
          }}
          isLoading={isOptionsLoading}
          container={container}
        />
      )}
    </>
  );
}
