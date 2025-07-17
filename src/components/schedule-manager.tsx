'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Plus, Pencil, Maximize, Minimize, X } from 'lucide-react';
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
  onFetchEvents: () => void;
  isLoading: boolean;
  onAddEvent: () => void;
  initialSelection: (Event | null)[];
  initialOrder: number[];
  setFutureSelection: (selection: (Event | null)[]) => void;
  setFutureOrder: (order: number[]) => void;
}

export function ScheduleManager({
  open,
  onOpenChange,
  currentSelection,
  currentOrder,
  schedules,
  onSchedulesChange,
  onModifyEventInView,
  onFetchEvents,
  isLoading,
  onAddEvent,
  initialSelection,
  initialOrder,
  setFutureSelection,
  setFutureOrder,
}: ScheduleManagerProps) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [modifyEventForSchedule, setModifyEventForSchedule] = useState<{ event: Event, index: number } | null>(null);

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
      onFetchEvents();
      resetToCurrentSelection();
    } else {
      setIsFullScreen(false); // Reset on close
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSaveOrUpdateSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    if (editingScheduleId) {
      // Update existing schedule
      const updatedSchedules = schedules.map(s => 
        s.id === editingScheduleId 
          ? { ...s, dateTime: combinedDateTime, events: currentSelection, order: currentOrder }
          : s
      );
      onSchedulesChange(updatedSchedules);
    } else {
      // Add new schedule
      const newSchedule: Schedule = {
        id: new Date().toISOString(),
        dateTime: combinedDateTime,
        events: currentSelection,
        order: currentOrder,
      };
      onSchedulesChange([...schedules, newSchedule]);
    }
    
    // Reset form to allow creating a new schedule
    resetToCurrentSelection();
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
    const newSelection = [...currentSelection];
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
  
  const handleModifyEventForSchedule = (event: Event, option: string) => {
    if (modifyEventForSchedule) {
      const newFutureSelection = [...currentSelection];
      newFutureSelection[modifyEventForSchedule.index] = { ...event, selectedOption: option };
      setFutureSelection(newFutureSelection);
      setModifyEventForSchedule(null);
    }
  };

  const activeFutureEventsCount = currentOrder?.filter(i => currentSelection[i] !== null).length ?? 0;

  return (
    <>
      {modifyEventForSchedule && (
        <Dialog open={!!modifyEventForSchedule} onOpenChange={(open) => {
            if(!open) {
                setModifyEventForSchedule(null)
            }
        }}>
           <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} data-sub-dialog="true">
              <EventSelectionDialog
                isOpen={!!modifyEventForSchedule}
                onOpenChange={(open) => {if(!open) setModifyEventForSchedule(null)}}
                event={modifyEventForSchedule.event}
                onSelect={handleModifyEventForSchedule}
                isModification={true}
                onRemove={() => {}}
                windowNumber={modifyEventForSchedule.index + 1}
              />
           </DialogContent>
        </Dialog>
      )}


      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
        <DialogContent 
            hideClose={true}
            className={cn(
                "max-w-4xl w-full h-[90vh] flex flex-col p-0 transition-all duration-300",
                 isFullScreen && "w-screen h-screen max-w-none rounded-none"
            )}
            onInteractOutside={(e) => {
                const target = e.target as HTMLElement;
                // Allow interacting with elements inside other dialogs/popovers
                if (target.closest('[role="dialog"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                    const isSubDialog = (target.closest('[role="dialog"]') as HTMLElement)?.dataset?.subDialog;
                    if (isSubDialog) {
                       return;
                    }
                    e.preventDefault();
                }
            }}
             onOpenAutoFocus={(e) => e.preventDefault()}
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
                              order={currentOrder ? currentOrder.filter(i => currentSelection[i] !== null) : []}
                              onOrderChange={handleOrderChange}
                              eventDetails={currentSelection}
                              onRemove={handleRemoveEventFromFuture}
                              onModify={(event, index) => {
                                const currentEventState = currentSelection[index];
                                if (!currentEventState) return;
                                const eventForModification = { ...event, selectedOption: currentEventState.selectedOption };
                                setModifyEventForSchedule({ event: eventForModification, index });
                              }}
                              isViewPage={true}
                              onAddEvent={onAddEvent}
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
