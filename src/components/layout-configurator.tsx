
'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LayoutConfiguratorProps {
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
}

export function LayoutConfigurator({
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  isChatEnabled,
  onIsChatEnabledChange,
}: LayoutConfiguratorProps) {
  return (
    <Accordion type="multiple" className="w-full space-y-4">
      <AccordionItem value="item-1" className="border rounded-lg px-4">
        <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
        <AccordionContent className="pt-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="grid-gap">Bordes ({gridGap}px)</Label>
              <Slider
                id="grid-gap"
                min={0}
                max={20}
                step={1}
                value={[gridGap]}
                onValueChange={(value) => onGridGapChange(value[0])}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="border-color">Color de Borde</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="border-color"
                  type="color"
                  value={borderColor}
                  onChange={(e) => onBorderColorChange(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  type="text"
                  value={borderColor}
                  onChange={(e) => onBorderColorChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <div className="p-2 rounded-md aspect-video" style={{ backgroundColor: borderColor }}>
                <div className="grid grid-cols-3 h-full" style={{ gap: `${gridGap}px`}}>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2" className="border rounded-lg px-4">
        <AccordionTrigger>Funciones Adicionales</AccordionTrigger>
        <AccordionContent className="pt-2">
           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-1.5 pr-4">
              <Label>Activar Chat</Label>
               <p className="text-xs text-muted-foreground">
                Muestra u oculta el botón para abrir el chat en la vista de visualización.
              </p>
            </div>
            <Switch
              checked={isChatEnabled}
              onCheckedChange={onIsChatEnabledChange}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
