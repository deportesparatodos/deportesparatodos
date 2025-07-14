
'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from './ui/label';
import type { Event } from './event-carousel';
import { EventListManagement } from './layout-configurator';
import { Separator } from './ui/separator';

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
}

export function ScheduleManager({
  open,
  onOpenChange,
  currentSelection,
  currentOrder,
  schedules,
  onSchedulesChange,
  onModifyEventInView
}: ScheduleManagerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');

  // State for the events that will be in the new schedule
  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>(currentSelection);
  const [futureOrder, setFutureOrder] = useState<number[]>(currentOrder);

  // When current view selection changes, reset the schedule builder
  useEffect(() => {
    if (open) {
        setFutureSelection(currentSelection);
        setFutureOrder(currentOrder);
    }
  }, [open, currentSelection, currentOrder]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  }, []);

  const handleAddSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const newSchedule: Schedule = {
      id: new Date().toISOString(),
      dateTime: combinedDateTime,
      events: futureSelection,
      order: futureOrder,
    };

    onSchedulesChange([...schedules, newSchedule]);
    setDate(new Date());
    setTime('12:00');
  };
  
  const handleRemoveSchedule = (id: string) => {
    onSchedulesChange(schedules.filter(s => s.id !== id));
  };
  
  const handleRemoveEvent = (indexToRemove: number) => {
    const newSelection = [...futureSelection];
    newSelection[indexToRemove] = null;
    setFutureSelection(newSelection);
    
    const newOrder = futureOrder.filter(i => i !== indexToRemove);
    setFutureOrder(newOrder);
  };

  const handleModifyEvent = (event: Event, index: number) => {
      onModifyEventInView(event, index);
  }

  const handleOrderChange = (newOrder: number[]) => {
      const fullNewOrder = [...newOrder];
      const presentIndexes = new Set(newOrder);
      for(let i=0; i<9; i++) {
          if(!presentIndexes.has(i) && futureSelection[i] !== null) {
              if(!presentIndexes.has(i)) fullNewOrder.push(i);
          }
      }
      setFutureOrder(fullNewOrder);
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Programar Selección</DialogTitle>
          <DialogDescription>
            Configura una selección de eventos y canales para que se activen en un momento específico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 flex-grow h-0">
            {/* Left Column */}
            <div className="flex flex-col border-r">
                 <h3 className="px-4 py-2 text-lg font-semibold">Programaciones Activas</h3>
                 <Separator />
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
                                        Cantidad de Eventos/Canales: {schedule.events.filter(Boolean).length}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveSchedule(schedule.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </div>
                            ))
                    )}
                    </div>
                 </ScrollArea>
            </div>
            
            {/* Right Column */}
            <div className="flex flex-col">
                 <h3 className="px-4 py-2 text-lg font-semibold">Configuración de la Programación</h3>
                 <Separator />
                 <div className="flex flex-wrap items-center gap-4 p-4 border-b">
                     <div className="space-y-1">
                        <Label>Fecha</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={'outline'}
                            className={cn('w-[200px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : <span>Elige una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label>Hora</Label>
                        <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                </div>

                <ScrollArea className="flex-grow h-0">
                    <div className="p-4">
                        <EventListManagement
                            order={futureOrder.filter(i => futureSelection[i] !== null)}
                            onOrderChange={handleOrderChange}
                            eventDetails={futureSelection}
                            onRemove={handleRemoveEvent}
                            onModify={handleModifyEvent}
                            isViewPage={true}
                            onAddEvent={() => {
                                onOpenChange(false); // Close schedule dialog
                                // You might need a way to reopen it after adding an event
                            }}
                        />
                    </div>
                </ScrollArea>
                 <div className="p-4 border-t mt-auto">
                    <Button className="w-full" onClick={handleAddSchedule} disabled={futureSelection.filter(Boolean).length === 0}>
                        Guardar Programación
                    </Button>
                 </div>
            </div>
        </div>
        <DialogFooter className="p-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
