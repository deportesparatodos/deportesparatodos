
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface Preset {
  name: string;
  channels: { name: string; optionIndex: number }[];
}

const presets: Preset[] = [
  {
    name: 'Noticias',
    channels: [
      { name: 'LN+', optionIndex: 0 },
      { name: 'TN', optionIndex: 0 },
      { name: 'C5N', optionIndex: 0 },
    ],
  },
  {
    name: 'Deportivos',
    channels: [
      { name: 'TyC Sports', optionIndex: 0 },
      { name: 'TNT Sports', optionIndex: 0 },
      { name: 'ESPN ARGENTINA', optionIndex: 0 },
    ],
  },
  {
    name: 'Noticias + Deportivo',
    channels: [
      { name: 'TyC Sports', optionIndex: 0 },
      { name: 'ESPN ARGENTINA', optionIndex: 0 },
      { name: 'TN', optionIndex: 0 },
      { name: 'LN+', optionIndex: 0 },
    ],
  },
];

interface PresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (channels: { name: string; optionIndex: number }[]) => void;
  container?: HTMLElement;
}

export function PresetsDialog({ open, onOpenChange, onSelectPreset, container }: PresetsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal container={container}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar un Preset</DialogTitle>
            <DialogDescription>
              Esto limpiará tu selección actual y la reemplazará con los canales del preset.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72">
            <div className="grid grid-cols-1 gap-2 p-1">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => onSelectPreset(preset.channels)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
