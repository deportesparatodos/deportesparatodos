

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Pencil, ArrowLeft, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Event } from './event-carousel';
import type { Channel } from './channel-list';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Trash2 } from 'lucide-react';

export interface PresetChannel {
  id: string; // event id or channel name
  name: string;
  optionIndex: number;
  isEvent: boolean;
}

export interface Preset {
  id: string;
  name: string;
  channels: PresetChannel[];
}

interface PresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (preset: Preset) => void;
  container?: HTMLElement;
  customPresets: Preset[];
  onSavePreset: (newPreset: Omit<Preset, 'id'>) => void;
  onUpdatePreset: (updatedPreset: Preset) => void;
  onDeletePreset: (presetId: string) => void;
  allEvents: Event[];
  allChannels: Channel[];
  isRemote?: boolean;
}

const staticPresets: Preset[] = [
  {
    id: 'static-news',
    name: 'Noticias',
    channels: [
      { id: 'LN+', name: 'LN+', optionIndex: 0, isEvent: false },
      { id: 'TN', name: 'TN', optionIndex: 0, isEvent: false },
      { id: 'C5N', name: 'C5N', optionIndex: 0, isEvent: false },
    ],
  },
  {
    id: 'static-sports',
    name: 'Deportivos',
    channels: [
      { id: 'TyC Sports', name: 'TyC Sports', optionIndex: 0, isEvent: false },
      { id: 'TNT Sports', name: 'TNT Sports', optionIndex: 0, isEvent: false },
      { id: 'ESPN ARGENTINA', name: 'ESPN ARGENTINA', optionIndex: 0, isEvent: false },
    ],
  },
  {
    id: 'static-news-sports',
    name: 'Noticias + Deportivo',
    channels: [
      { id: 'TyC Sports', name: 'TyC Sports', optionIndex: 0, isEvent: false },
      { id: 'ESPN ARGENTINA', name: 'ESPN ARGENTINA', optionIndex: 0, isEvent: false },
      { id: 'TN', name: 'TN', optionIndex: 0, isEvent: false },
      { id: 'LN+', name: 'LN+', optionIndex: 0, isEvent: false },
    ],
  },
];


function PresetEditor({ 
    onBack, 
    onSave, 
    onDelete,
    existingPreset,
    allEvents,
    allChannels 
}: { 
    onBack: () => void, 
    onSave: (preset: Omit<Preset, 'id'> | Preset) => void,
    onDelete?: (presetId: string) => void,
    existingPreset?: Preset | null,
    allEvents: Event[],
    allChannels: Channel[] 
}) {
    const [name, setName] = useState(existingPreset?.name || '');
    const [selectedItems, setSelectedItems] = useState<PresetChannel[]>(existingPreset?.channels || []);
    const [searchTerm, setSearchTerm] = useState('');

    const { combinedItems } = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();

        const eventItems: PresetChannel[] = allEvents.map(e => ({ id: e.id, name: e.title, optionIndex: 0, isEvent: true }));
        const channelItems: PresetChannel[] = allChannels.map(c => ({ id: c.name, name: c.name, optionIndex: 0, isEvent: false }));
        
        let allItems = [...eventItems, ...channelItems];

        if (searchTerm) {
            allItems = allItems.filter(item => item.name.toLowerCase().includes(lowercasedFilter));
        }
        
        return { combinedItems: allItems };
    }, [allEvents, allChannels, searchTerm]);

    const handleToggleItem = (item: PresetChannel) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(p => p.id === item.id);
            if (isSelected) {
                return prev.filter(p => p.id !== item.id);
            } else {
                 if (prev.length >= 9) {
                    // Maybe show a toast here in the future
                    return prev;
                }
                return [...prev, item];
            }
        });
    };
    
    const handleSave = () => {
        if (!name.trim()) return; // Add validation feedback
        
        if (existingPreset) {
            onSave({ ...existingPreset, name, channels: selectedItems });
        } else {
            onSave({ name, channels: selectedItems });
        }
        onBack();
    };
    
    const handleDelete = () => {
        if (existingPreset && onDelete) {
            onDelete(existingPreset.id);
        }
        onBack();
    };

    return (
        <div className="flex flex-col h-full">
            <DialogHeader className="p-4 border-b flex-row items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>{existingPreset ? 'Editar' : 'Crear'} Preset</DialogTitle>
            </DialogHeader>

            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="preset-name">Nombre del Preset</Label>
                    <Input
                        id="preset-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Mis Canales Favoritos"
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Canales/Eventos Seleccionados ({selectedItems.length}/9)</Label>
                    <div className="flex flex-wrap gap-1">
                        {selectedItems.map(item => (
                             <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
                                {item.name}
                                <button onClick={() => handleToggleItem(item)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="search-items">Buscar Canales o Eventos</Label>
                    <Input
                        id="search-items"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar..."
                    />
                </div>
            </div>

            <ScrollArea className="flex-grow h-0">
                <div className="grid grid-cols-1 gap-1 p-4">
                    {combinedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary">
                            <Checkbox
                                id={item.id}
                                checked={selectedItems.some(p => p.id === item.id)}
                                onCheckedChange={() => handleToggleItem(item)}
                                disabled={!selectedItems.some(p => p.id === item.id) && selectedItems.length >= 9}
                            />
                            <Label htmlFor={item.id} className="w-full font-normal cursor-pointer">{item.name}</Label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            
            <DialogFooter className="p-4 border-t gap-2 flex-row justify-end">
                {existingPreset && onDelete && (
                    <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Eliminar
                    </Button>
                )}
                <Button variant="secondary" onClick={onBack}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
        </div>
    );
}


export function PresetsDialog({ 
    open, 
    onOpenChange, 
    onSelectPreset, 
    container,
    customPresets,
    onSavePreset,
    onUpdatePreset,
    onDeletePreset,
    allEvents,
    allChannels,
    isRemote = false,
}: PresetsDialogProps) {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
    
    useEffect(() => {
        if (!open) {
            setView('list');
            setEditingPreset(null);
        }
    }, [open]);

    const handleCreateClick = () => {
        setEditingPreset(null);
        setView('editor');
    };

    const handleEditClick = (preset: Preset) => {
        setEditingPreset(preset);
        setView('editor');
    };
    
    const handleSave = (presetData: Omit<Preset, 'id'> | Preset) => {
        if ('id' in presetData) {
            onUpdatePreset(presetData);
        } else {
            onSavePreset(presetData);
        }
    };

  const dialogContent = (
     <>
        {view === 'list' && (
            <>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Seleccionar un Preset</DialogTitle>
                    {!isRemote && (
                      <DialogDescription>
                        Carga una selección guardada o crea una nueva.
                      </DialogDescription>
                    )}
                </DialogHeader>
                {!isRemote && (
                  <div className="p-4">
                      <Button className="w-full" onClick={handleCreateClick}>
                          <Plus className="mr-2 h-4 w-4"/>
                          Crear Nuevo Preset
                      </Button>
                  </div>
                )}

                <ScrollArea className="flex-grow px-4">
                    <div className="grid grid-cols-1 gap-2 p-1">
                        <h3 className="text-sm font-semibold text-muted-foreground px-1 pt-2 pb-1">Presets Estándar</h3>
                        {staticPresets.map((preset) => (
                            <Button
                            key={preset.id}
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => onSelectPreset(preset)}
                            >
                            {preset.name}
                            </Button>
                        ))}

                        {customPresets.length > 0 && (
                            <h3 className="text-sm font-semibold text-muted-foreground px-1 pt-4 pb-1">Mis Presets</h3>
                        )}
                        {customPresets.map((preset) => (
                            <div key={preset.id} className="flex items-center gap-2">
                                 <Button
                                    variant="secondary"
                                    className="w-full justify-start"
                                    onClick={() => onSelectPreset(preset)}
                                    >
                                    {preset.name}
                                </Button>
                                {!isRemote && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(preset)}>
                                      <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                 <DialogFooter className="p-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </>
        )}
        {view === 'editor' && (
            <PresetEditor 
                onBack={() => setView('list')}
                onSave={handleSave}
                onDelete={onDeletePreset}
                existingPreset={editingPreset}
                allEvents={allEvents}
                allChannels={allChannels}
            />
        )}
    </>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal container={container}>
        <DialogContent className="sm:max-w-md p-0 h-[70vh] flex flex-col">
            {dialogContent}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
