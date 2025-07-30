
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from './ui/label';
import type { Subscription } from '@/app/page';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Pencil } from 'lucide-react';
import { Separator } from './ui/separator';

interface NotificationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: Subscription[];
  pushoverEmail: string;
  onSubscriptionUpdate: (subscriptions: Subscription[], pushoverEmail: string) => void;
}

export function NotificationManager({
  open,
  onOpenChange,
  subscriptions,
  pushoverEmail,
  onSubscriptionUpdate,
}: NotificationManagerProps) {
  const [localPushoverEmail, setLocalPushoverEmail] = useState(pushoverEmail);
  const [localSubscriptions, setLocalSubscriptions] = useState<Subscription[]>(subscriptions);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocalPushoverEmail(pushoverEmail);
      setLocalSubscriptions(JSON.parse(JSON.stringify(subscriptions))); // Deep copy
    }
  }, [open, pushoverEmail, subscriptions]);

  const handleSave = () => {
    onSubscriptionUpdate(localSubscriptions, localPushoverEmail);
    onOpenChange(false);
  };
  
  const handleRemoveSubscription = (id: string) => {
    setLocalSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };
  
  const handleNotifyAtChange = (id: string, newNotifyAt: string) => {
     setLocalSubscriptions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, notifyAt: parseInt(newNotifyAt, 10) } : sub
     ));
     setEditingSubId(null);
  };

  const eventSubscriptions = localSubscriptions.filter(s => s.type === 'event');
  const categorySubscriptions = localSubscriptions.filter(s => s.type === 'category');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Gestionar Notificaciones</DialogTitle>
          <DialogDescription>
            Configura tu email de Pushover y gestiona todas tus suscripciones.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow h-0">
            <div className='p-6 space-y-6'>
                <div>
                    <Label htmlFor="pushover-email" className="font-semibold">
                    Email de Pushover
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                        Ingresa el email que te proporciona la app de Pushover para recibir las notificaciones.
                    </p>
                    <Input
                    id="pushover-email"
                    type="email"
                    value={localPushoverEmail}
                    onChange={(e) => setLocalPushoverEmail(e.target.value)}
                    placeholder="tu.usuario+XXXX@api.pushover.net"
                    />
                </div>
                
                <Separator />

                <div>
                    <h3 className="font-semibold mb-2">Suscripciones a Eventos</h3>
                    {eventSubscriptions.length > 0 ? (
                    <div className="space-y-2">
                        {eventSubscriptions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-md border bg-secondary/50">
                            <span className="text-sm font-medium truncate pr-4">{sub.title}</span>
                             <div className="flex items-center gap-2">
                                <Select onValueChange={(value) => handleNotifyAtChange(sub.id, value)} defaultValue={String(sub.notifyAt)}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Al comenzar</SelectItem>
                                        <SelectItem value="5">5 mins antes</SelectItem>
                                        <SelectItem value="15">15 mins antes</SelectItem>
                                        <SelectItem value="30">30 mins antes</SelectItem>
                                        <SelectItem value="60">1 hora antes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => handleRemoveSubscription(sub.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No tienes suscripciones a eventos individuales.</p>
                    )}
                </div>

                <Separator />

                <div>
                    <h3 className="font-semibold mb-2">Suscripciones a Categorías</h3>
                    {categorySubscriptions.length > 0 ? (
                    <div className="space-y-2">
                        {categorySubscriptions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-md border bg-secondary/50">
                            <span className="text-sm font-medium truncate pr-4">{sub.title}</span>
                             <div className="flex items-center gap-2">
                                <Select onValueChange={(value) => handleNotifyAtChange(sub.id, value)} defaultValue={String(sub.notifyAt)}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Al comenzar</SelectItem>
                                        <SelectItem value="5">5 mins antes</SelectItem>
                                        <SelectItem value="15">15 mins antes</SelectItem>
                                        <SelectItem value="30">30 mins antes</SelectItem>
                                        <SelectItem value="60">1 hora antes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => handleRemoveSubscription(sub.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No tienes suscripciones a categorías.</p>
                    )}
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
