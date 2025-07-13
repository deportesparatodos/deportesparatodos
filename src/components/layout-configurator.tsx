
'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

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
            <div className="p-2 rounded-md" style={{ backgroundColor: borderColor }}>
                <div className="grid grid-cols-2 gap-1 h-20" style={{ gap: `${gridGap}px`}}>
                    <div className="bg-card rounded-sm"></div>
                    <div className="bg-card rounded-sm"></div>
                    <div className="bg-card rounded-sm"></div>
                    <div className="bg-card rounded-sm"></div>
                </div>
            </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Label>Activar Chat</Label>
        </div>
        <Switch
          checked={isChatEnabled}
          onCheckedChange={onIsChatEnabledChange}
        />
      </div>
    </div>
  );
}
