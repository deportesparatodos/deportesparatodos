
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSubscription();
    }
  }, [open, toast]);

  const loadSubscription = () => {
    setIsLoading(true);
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
        description: 'No se pudo cargar la configuración de notificaciones.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce una dirección de correo válida.',
      });
      return;
    }
    
    setIsSaving(true);
    
    const newSubscription: Subscription = {
      email,
      subscribedCategories: subscriptionType === 'all' ? ['all'] : selectedCategories,
    };

    try {
      // Save to localStorage, which is now the primary source of truth.
      localStorage.setItem('notification-email', email);
      localStorage.setItem('notification-subscription', JSON.stringify(newSubscription));
      
      // The API endpoint now just confirms the save without a database operation.
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription),
      });

      if (response.ok) {
        toast({
          title: 'Guardado',
          description: 'Tus preferencias de notificación han sido guardadas.',
        });
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subscription');
      }
    } catch (error: any) {
      console.error('Error saving subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudieron guardar tus preferencias. Inténtalo de nuevo.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
     if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce una dirección de correo válida para enviar la prueba.',
      });
      return;
    }
    setIsSendingTest(true);

    const testSubscription = {
      email,
      subscribedCategories: subscriptionType === 'all' ? ['all'] : selectedCategories,
    };

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSubscription),
      });

      if (response.ok) {
        toast({
          title: '¡Prueba Enviada!',
          description: 'Revisa tu bandeja de entrada para confirmar la recepción de la notificación.',
        });
      } else {
         const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test notification');
      }

    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Envío',
        description: error.message || 'No se pudo enviar la notificación de prueba. Verifica la consola para más detalles.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestionar Notificaciones</DialogTitle>
          <DialogDescription>
            Recibe un resumen diario de los eventos a las 8:00 AM.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
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
                Asegúrate de que tu proveedor de correo no marque nuestros emails como spam.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          <Button type="button" variant="outline" onClick={handleSendTest} disabled={isLoading || isSendingTest || !email}>
             {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Prueba
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleSave} disabled={isLoading || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
