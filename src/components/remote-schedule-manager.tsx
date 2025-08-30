
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Plus, Pencil, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from './ui/label';
import type { Event } from './event-carousel';
import { EventList } from './layout-configurator';
import { Separator } from './ui/separator';
import { Input } from './ui/input';

export interface Schedule {
  id: string;
  dateTime: Date;
  events: (Event | null)[];
  order: number[];
}

interface RemoteScheduleManagerProps {
  onBack: () => void;
  initialSelection: (Event | null)[];
  initialOrder: number[];
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
  onAddEventFromSchedule: () => void;
}

export function RemoteScheduleManager({
  onBack,
  initialSelection,
  initialOrder,
  schedules,
  onSchedulesChange,
  onAddEventFromSchedule,
}: RemoteScheduleManagerProps) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  
  const [currentSelection, setCurrentSelection] = useState<(Event|null)[]>(initialSelection);
  const [currentOrder, setCurrentOrder] = useState<number[]>(initialOrder);

  const resetToCurrentSelection = () => {
    setCurrentSelection([...initialSelection]);
    const activeCurrentOrder = initialOrder.filter(i => initialSelection[i] !== null);
    const fullOrder = Array.from({ length: 9 }, (_, i) => i);
    const finalOrder = [...activeCurrentOrder, ...fullOrder.filter(i => !activeCurrentOrder.includes(i))];
    setCurrentOrder(finalOrder);
    setDate(new Date());
    setTime(format(new Date(), 'HH:mm'));
    setEditingScheduleId(null);
  };
  
  useEffect(() => {
    resetToCurrentSelection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelection, initialOrder]);

  const handleSaveOrUpdateSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const activeOrder = currentOrder.filter(i => currentSelection[i] !== null);

    if (editingScheduleId) {
      const updatedSchedules = schedules.map(s => 
        s.id === editingScheduleId 
          ? { ...s, dateTime: combinedDateTime, events: currentSelection, order: activeOrder }
          : s
      );
      onSchedulesChange(updatedSchedules);
    } else {
      const newSchedule: Schedule = {
        id: new Date().toISOString(),
        dateTime: combinedDateTime,
        events: currentSelection,
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
    setCurrentSelection([...schedule.events]);
    
    const fullOrder = Array.from({ length: 9 }, (_, i) => i);
    const finalOrder = [...schedule.order, ...fullOrder.filter(i => !schedule.order.includes(i))];
    setCurrentOrder(finalOrder);
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
    setCurrentSelection(newSelection);
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
      setCurrentOrder(fullNewOrder);
    }
  }
  
  const activeFutureEventsCount = currentOrder?.filter(i => currentSelection[i] !== null).length ?? 0;

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="p-4 border-b flex-shrink-0 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Programar Selección</h2>
        </header>

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
                            order={currentOrder ? currentOrder.filter(i => currentSelection[i] !== null) : []}
                            onOrderChange={handleOrderChange}
                            eventDetails={currentSelection}
                            onRemove={handleRemoveEventFromFuture}
                            onModify={(index) => {
                              alert("Para modificar un evento en una programación, por favor elimínalo y vuelve a añadirlo.");
                            }}
                            isViewPage={true}
                        />
                    </div>
                </ScrollArea>
                 <div className="p-4 border-t border-border mt-auto flex-shrink-0 space-y-2">
                    <Button variant="outline" className="w-full" onClick={onAddEventFromSchedule}>
                        <Plus className="mr-2 h-4 w-4"/> Añadir Evento/Canal a Programación
                    </Button>
                    <Button className="w-full" onClick={handleSaveOrUpdateSchedule} disabled={activeFutureEventsCount === 0}>
                        {editingScheduleId ? 'Actualizar Programación' : 'Guardar Programación'}
                    </Button>
                 </div>
            </div>
        </div>
    </div>
  );
}
