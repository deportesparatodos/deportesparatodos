
'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
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
import { EventListManagement } from './layout-configurator';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import type { Channel } from './channel-list';
import { AddEventsDialog } from '@/app/view/page'; 
import { EventSelectionDialog } from './event-selection-dialog';

export interface Schedule {
  id: string;
  dateTime: Date;
  events: (Event | null)[];
  order: number[];
}

interface ScheduleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSelection: (Event | null)[];
  currentOrder: number[];
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
  onModifyEventInView: (event: Event, index: number) => void;
  allEvents: Event[];
  allChannels: Channel[];
}

export function ScheduleManager({
  open,
  onOpenChange,
  currentSelection,
  currentOrder,
  schedules,
  onSchedulesChange,
  onModifyEventInView,
  allEvents,
  allChannels
}: ScheduleManagerProps) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  
  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
  const [futureOrder, setFutureOrder] = useState<number[]>([]);
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [modifyEventForSchedule, setModifyEventForSchedule] = useState<{ event: Event, index: number } | null>(null);

  const resetToCurrentSelection = () => {
    setFutureSelection([...currentSelection]);
    const activeCurrentOrder = currentOrder.filter(i => currentSelection[i] !== null);
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
    }
  }, [open, currentSelection, currentOrder]);

  const handleSaveOrUpdateSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    if (editingScheduleId) {
      // Update existing schedule
      const updatedSchedules = schedules.map(s => 
        s.id === editingScheduleId 
          ? { ...s, dateTime: combinedDateTime, events: futureSelection, order: futureOrder }
          : s
      );
      onSchedulesChange(updatedSchedules);
    } else {
      // Add new schedule
      const newSchedule: Schedule = {
        id: new Date().toISOString(),
        dateTime: combinedDateTime,
        events: futureSelection,
        order: futureOrder,
      };
      onSchedulesChange([...schedules, newSchedule]);
    }
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setDate(new Date(schedule.dateTime));
    setTime(format(new Date(schedule.dateTime), 'HH:mm'));
    setFutureSelection([...schedule.events]);
    setFutureOrder([...schedule.order]);
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
  
  const handleOrderChange = (newOrder: number[]) => {
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
  }
  
  const handleAddEventToFuture = (event: Event, option: string) => {
      const newFutureSelection = [...futureSelection];
      const eventWithSelection = { ...event, selectedOption: option };
      
      const emptyIndex = newFutureSelection.findIndex(e => e === null);
      if (emptyIndex !== -1) {
          newFutureSelection[emptyIndex] = eventWithSelection;
          setFutureSelection(newFutureSelection);

          // Update order if needed
          const newFutureOrder = [...(futureOrder || [])];
           const activeIndexes = newFutureSelection.map((e, i) => e ? i : -1).filter(i => i !== -1);
           const currentOrderActive = newFutureOrder.filter(i => activeIndexes.includes(i));
           const finalOrder = [...currentOrderActive];
           for (let i = 0; i < 9; i++) {
               if (!finalOrder.includes(i)) {
                   finalOrder.push(i);
               }
           }
           setFutureOrder(finalOrder);

      } else {
          alert("Todos los espacios están ocupados.");
      }
      setAddEventsDialogOpen(false);
  };

  const handleModifyEventForSchedule = (event: Event, option: string) => {
    if (modifyEventForSchedule) {
      const newFutureSelection = [...futureSelection];
      newFutureSelection[modifyEventForSchedule.index] = { ...event, selectedOption: option };
      setFutureSelection(newFutureSelection);
      setModifyEventForSchedule(null);
    }
  };

  const activeFutureEventsCount = futureOrder?.filter(i => futureSelection[i] !== null).length ?? 0;

  return (
    <>
      <AddEventsDialog 
        open={addEventsDialogOpen}
        onOpenChange={setAddEventsDialogOpen}
        onSelect={handleAddEventToFuture}
        selectedEvents={futureSelection}
        allEvents={allEvents}
        allChannels={allChannels}
      />
      
      <Dialog open={!!modifyEventForSchedule} onOpenChange={(open) => {if(!open) setModifyEventForSchedule(null)}}>
        <EventSelectionDialog
          isOpen={!!modifyEventForSchedule}
          onOpenChange={(open) => {if(!open) setModifyEventForSchedule(null)}}
          event={modifyEventForSchedule!.event}
          onSelect={handleModifyEventForSchedule}
          isModification={true}
          onRemove={() => {}}
          windowNumber={modifyEventForSchedule!.index + 1}
        />
      </Dialog>


      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle>Programar Selección</DialogTitle>
            <DialogDescription>
              Configura o modifica una selección de eventos para que se activen en un momento específico.
            </DialogDescription>
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
                                  <div>
                                      <p className="font-bold">{format(schedule.dateTime, 'EEE, d MMM, p')}</p>
                                      <p className="text-sm text-muted-foreground">
                                          Eventos: {schedule.events.filter(Boolean).length}
                                      </p>
                                  </div>
                                  <div className="flex items-center">
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
                          <EventListManagement
                              order={futureOrder ? futureOrder.filter(i => futureSelection[i] !== null) : []}
                              onOrderChange={handleOrderChange}
                              eventDetails={futureSelection}
                              onRemove={handleRemoveEventFromFuture}
                              onModify={(event, index) => {
                                const currentEventState = futureSelection[index];
                                if (!currentEventState) return;
                                const eventForModification = { ...event, selectedOption: currentEventState.selectedOption };
                                setModifyEventForSchedule({ event: eventForModification, index });
                              }}
                              isViewPage={true}
                              onAddEvent={() => setAddEventsDialogOpen(true)}
                          />
                      </div>
                  </ScrollArea>
                   <div className="p-4 border-t border-border mt-auto flex-shrink-0">
                      <Button className="w-full" onClick={handleSaveOrUpdateSchedule} disabled={activeFutureEventsCount === 0}>
                          {editingScheduleId ? 'Actualizar Programación' : 'Guardar Programación'}
                      </Button>
                   </div>
              </div>
          </div>
          <DialogFooter className="p-4 border-t border-border flex-shrink-0">
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
