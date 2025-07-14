
'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export interface Schedule {
  id: string;
  dateTime: Date;
  events: (Event | null)[];
}

interface ScheduleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSelection: (Event | null)[];
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
}

export function ScheduleManager({
  open,
  onOpenChange,
  currentSelection,
  schedules,
  onSchedulesChange,
}: ScheduleManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [selectedForSchedule, setSelectedForSchedule] = useState<boolean[]>(Array(9).fill(false));

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

    const newScheduledEvents = Array(9).fill(null);
    selectedForSchedule.forEach((isSelected, index) => {
      if (isSelected) {
        newScheduledEvents[index] = currentSelection[index];
      }
    });

    const newSchedule: Schedule = {
      id: new Date().toISOString(),
      dateTime: combinedDateTime,
      events: newScheduledEvents,
    };

    onSchedulesChange([...schedules, newSchedule]);
    setAddDialogOpen(false);
    setDate(new Date());
    setTime('12:00');
    setSelectedForSchedule(Array(9).fill(false));
  };
  
  const handleRemoveSchedule = (id: string) => {
    onSchedulesChange(schedules.filter(s => s.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Programar Selección</DialogTitle>
          <DialogDescription>
            Configura qué ventanas se activarán en una fecha y hora específicas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="mb-4 text-lg font-semibold">Programaciones Activas</h3>
          <ScrollArea className="h-48 pr-4 border rounded-lg">
            {schedules.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">No hay programaciones activas.</p>
            ) : (
                <div className="space-y-2 p-2">
                    {schedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                           <div>
                             <p className="font-medium">{format(schedule.dateTime, 'PPP p')}</p>
                             <p className="text-sm text-muted-foreground">
                                {schedule.events.filter(Boolean).length} ventanas activas
                             </p>
                           </div>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveSchedule(schedule.id)}>
                               <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                    ))}
                </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
            <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
            </DialogClose>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>Añadir Nueva Programación</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Crear Programación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
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
                    <div>
                        <Label>Ventanas a activar</Label>
                        <p className="text-sm text-muted-foreground">Selecciona los eventos que quieres que aparezcan a la hora programada.</p>
                        <ScrollArea className="h-64 mt-2 p-2 border rounded-md">
                           <div className="space-y-2">
                             {currentSelection.map((event, index) =>
                                event ? (
                                  <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-secondary/50">
                                    <Checkbox
                                      id={`schedule-event-${index}`}
                                      checked={selectedForSchedule[index]}
                                      onCheckedChange={(checked) => {
                                        const newSelected = [...selectedForSchedule];
                                        newSelected[index] = !!checked;
                                        setSelectedForSchedule(newSelected);
                                      }}
                                    />
                                    <label htmlFor={`schedule-event-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {`Ventana ${index + 1}: ${event.title}`}
                                    </label>
                                  </div>
                                ) : null
                              )}
                           </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddSchedule}>Guardar Programación</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
