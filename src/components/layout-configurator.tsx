
'use client';

import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface LayoutConfiguratorProps {
  numCameras: number;
  setNumCameras: Dispatch<SetStateAction<number>>;
  layoutOrder: number[];
  setLayoutOrder: Dispatch<SetStateAction<number[]>>;
}

export function LayoutConfigurator({
  numCameras,
  setNumCameras,
  layoutOrder,
  setLayoutOrder,
}: LayoutConfiguratorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleNumCamerasChange = (value: string) => {
    const newNum = parseInt(value, 10);
    setNumCameras(newNum);
  };
  
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget.firstElementChild) {
      e.dataTransfer.setDragImage(e.currentTarget.firstElementChild as Element, 20, 20);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const currentOrder = layoutOrder.slice(0, numCameras);
    
    const draggedItemContent = currentOrder[draggedIndex];
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(dropIndex, 0, draggedItemContent);
    
    // Create the full new order for saving to state
    const newFullOrder = [...layoutOrder];
    for (let i = 0; i < numCameras; i++) {
        newFullOrder[i] = currentOrder[i];
    }

    setLayoutOrder(newFullOrder);
    setDraggedIndex(null);
  };
  
  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  const gridColsClass = numCameras > 2 ? 'grid-cols-2' : 'grid-cols-1';
  let gridRowsClass = '';
  if (numCameras === 1) gridRowsClass = 'grid-rows-1';
  else if (numCameras === 2) gridRowsClass = 'grid-rows-2';
  else if (numCameras === 3) gridRowsClass = 'grid-rows-2';
  else if (numCameras === 4) gridRowsClass = 'grid-rows-2';


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="num-cameras-select">Cantidad de Ventanas</Label>
        <Select onValueChange={handleNumCamerasChange} value={String(numCameras)}>
          <SelectTrigger id="num-cameras-select">
            <SelectValue placeholder="Seleccionar cantidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Ventana</SelectItem>
            <SelectItem value="2">2 Ventanas</SelectItem>
            <SelectItem value="3">3 Ventanas</SelectItem>
            <SelectItem value="4">4 Ventanas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Organizar Vistas</Label>
        <div className={cn("grid h-48 gap-2 rounded-md bg-muted p-2", gridColsClass, gridRowsClass)}>
          {layoutOrder.slice(0, numCameras).map((cameraNumber, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                'relative flex cursor-move items-center justify-center rounded-md border-2 border-dashed bg-background text-2xl font-bold text-foreground transition-opacity',
                draggedIndex === index && 'opacity-30'
              )}
            >
              <GripVertical className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {cameraNumber + 1}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Arrastra y suelta los números para reordenar las ventanas.</p>
      </div>
    </div>
  );
}
