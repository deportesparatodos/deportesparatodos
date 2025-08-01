
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export interface Subscription {
  email: string;
  subscribedCategories: string[]; // 'all' or list of category names
}

interface NotificationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allCategories: string[];
}

export function NotificationManager({ open, onOpenChange, allCategories }: NotificationManagerProps) {
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subscriptionType, setSubscriptionType] = useState<'all' | 'specific'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSubscriptionFromLocalStorage();
    }
  }, [open]);

  const loadSubscriptionFromLocalStorage = () => {
    try {
      const storedEmail = localStorage.getItem('notification-email');
      const storedSub = localStorage.getItem('notification-subscription');
      if (storedEmail) {
        setEmail(storedEmail);
      }
      if (storedSub) {
        const data: Subscription = JSON.parse(storedSub);
        if (data.subscribedCategories.includes('all')) {
          setSubscriptionType('all');
          setSelectedCategories([]);
        } else {
          setSubscriptionType('specific');
          setSelectedCategories(data.subscribedCategories);
        }
      }
    } catch (error) {
      console.error('Error loading subscription from localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la configuración de notificaciones guardada.',
      });
    }
  };

  const handleSave = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Correo Inválido',
        description: 'Por favor, introduce una dirección de correo válida.',
      });
      return;
    }
    
    setIsSaving(true);
    
    const subscriptionData = {
      email,
      tags: subscriptionType === 'all' ? ['all'] : selectedCategories,
    };

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();

      if (response.ok) {
        // Save to localStorage on successful subscription
        const localSubscription: Subscription = {
          email,
          subscribedCategories: subscriptionType === 'all' ? ['all'] : selectedCategories,
        };
        localStorage.setItem('notification-email', email);
        localStorage.setItem('notification-subscription', JSON.stringify(localSubscription));

        toast({
          title: '¡Suscripción Exitosa!',
          description: result.message || 'Te has suscrito a las notificaciones.',
        });
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Ocurrió un error al suscribirte.');
      }
    } catch (error: any) {
      console.error('Error saving subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Suscripción',
        description: error.message || 'No se pudo completar la suscripción. Inténtalo de nuevo.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleSendTestEmail = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Correo Inválido',
        description: 'Por favor, introduce una dirección de correo para enviar la prueba.',
      });
      return;
    }
    
    setIsSendingTest(true);

    const testPayload = {
      email,
      categories: subscriptionType === 'all' ? ['all'] : selectedCategories,
    };

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: '¡Éxito!',
          description: result.message || `Correo de prueba enviado a ${email}.`,
        });
      } else {
        throw new Error(result.error || 'Ocurrió un error al enviar el correo de prueba.');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Envío',
        description: error.message || 'No se pudo enviar el correo de prueba.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gestionar Suscripción</DialogTitle>
          <DialogDescription>
            Suscríbete para recibir notificaciones de eventos por correo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="pushover-email">Tu Email</Label>
                <Input
                id="pushover-email"
                placeholder="tu.email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            
            <RadioGroup value={subscriptionType} onValueChange={(value) => setSubscriptionType(value as 'all' | 'specific')}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="r1" />
                    <Label htmlFor="r1">Notificarme de todos los eventos</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="r2" />
                    <Label htmlFor="r2">Notificarme solo de categorías específicas</Label>
                </div>
            </RadioGroup>

            {subscriptionType === 'specific' && (
                <div className="space-y-2">
                <Label>Selecciona Categorías</Label>
                <ScrollArea className="h-40 w-full rounded-md border p-4">
                    <div className="space-y-2">
                    {allCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                        <Checkbox 
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryChange(category)}
                        />
                        <Label htmlFor={category} className="font-normal">{category}</Label>
                    </div>
                    ))}
                    </div>
                </ScrollArea>
                </div>
            )}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                El envío de correos se gestiona a través de Mailchimp. Podrás darte de baja en cualquier momento desde los propios correos.
                </AlertDescription>
            </Alert>
            </div>
        </ScrollArea>

        <DialogFooter className="flex-col-reverse gap-2 pt-4 flex-shrink-0">
             <div className="grid grid-cols-2 gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSaving} className="w-full">
                    Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
           </div>
           <Button type="button" variant="outline" onClick={handleSendTestEmail} disabled={isSendingTest || isSaving} className="w-full">
                {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Prueba
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
