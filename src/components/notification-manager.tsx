
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
  DialogTrigger,
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subscriptionType, setSubscriptionType] = useState<'all' | 'specific'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const storedEmail = localStorage.getItem('pushover-email');
      if (storedEmail) {
        setEmail(storedEmail);
        fetchSubscription(storedEmail);
      } else {
        setIsLoading(false);
      }
    }
  }, [open]);

  const fetchSubscription = async (userEmail: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data: Subscription = await response.json();
        setSubscription(data);
        if (data.subscribedCategories.includes('all')) {
          setSubscriptionType('all');
          setSelectedCategories([]);
        } else {
          setSubscriptionType('specific');
          setSelectedCategories(data.subscribedCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
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
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription),
      });

      if (response.ok) {
        localStorage.setItem('pushover-email', email);
        setSubscription(newSubscription);
        toast({
          title: 'Guardado',
          description: 'Tus preferencias de notificación han sido guardadas.',
        });
        onOpenChange(false);
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar tus preferencias. Inténtalo de nuevo.',
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
              <Label htmlFor="pushover-email">Tu Email de Pushover</Label>
              <Input
                id="pushover-email"
                placeholder="tu_usuario@pushover.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => { if(email) fetchSubscription(email); }}
              />
              <Dialog>
                <DialogTrigger asChild>
                   <Button variant="link" className="p-0 h-auto text-xs">¿Cómo funciona esto?</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tutorial de Notificaciones con Pushover</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm space-y-3 text-muted-foreground">
                        <p>Para recibir notificaciones directamente en tu teléfono, usamos un servicio gratuito y confiable llamado <strong>Pushover</strong>.</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li><strong>Descarga la App:</strong> Busca e instala "Pushover Notifications" en la App Store (iOS) o Google Play (Android).</li>
                            <li><strong>Crea una Cuenta:</strong> Regístrate gratis en la app.</li>
                            <li><strong>Encuentra tu Email de Pushover:</strong> Una vez dentro de la app, verás tu dirección de correo especial de Pushover. Generalmente es `(tu_user_key)@pushover.net`.</li>
                            <li><strong>Ingrésalo Aquí:</strong> Copia esa dirección de correo y pégala en el campo de la pantalla anterior.</li>
                        </ol>
                        <p>¡Listo! Cada mañana te enviaremos un correo a esa dirección, y la app de Pushover te lo mostrará como una notificación push en tu teléfono.</p>
                    </div>
                </DialogContent>
              </Dialog>
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
                Asegúrate de haber verificado tu email en Pushover para que las notificaciones funcionen correctamente.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
