
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Settings, FileText, AlertCircle, Mail, BookOpen } from 'lucide-react';
import { Separator } from './ui/separator';
import { LayoutConfigurator } from './layout-configurator';
import type { Event } from '@/components/event-carousel';
import { Dialog, DialogClose, DialogContent, DialogFooter as DialogModalFooter, DialogHeader as DialogModalHeader, DialogTitle as DialogModalTitle, DialogTrigger as DialogModalTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface CameraConfigurationProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (event: Event, index: number) => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  isViewPage: boolean;
  onAddEvent: () => void;
}

export function CameraConfigurationComponent({ 
  order, 
  onOrderChange, 
  eventDetails, 
  onReload, 
  onRemove,
  onModify,
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  isChatEnabled,
  onIsChatEnabledChange,
  isViewPage,
  onAddEvent
}: CameraConfigurationProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-0 text-center">
          <SheetTitle>Configurar Vista</SheetTitle>
          <SheetDescription>
            Ajusta el diseño y gestiona los eventos activos.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="flex-grow px-6">
            <LayoutConfigurator
                gridGap={gridGap}
                onGridGapChange={onGridGapChange}
                borderColor={borderColor}
                onBorderColorChange={onBorderColorChange}
                isChatEnabled={isChatEnabled}
                onIsChatEnabledChange={onIsChatEnabledChange}
                order={order}
                onOrderChange={onOrderChange}
                eventDetails={eventDetails}
                onReload={onReload}
                onRemove={onRemove}
                onModify={onModify}
                isViewPage={isViewPage}
                onAddEvent={onAddEvent}
            />
        </ScrollArea>
        {isViewPage && (
          <SheetFooter className="p-4 border-t border-border mt-auto">
            <div className="space-y-2 w-full">
              <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                          <BookOpen />
                          Tutorial
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                      <DialogModalHeader>
                          <DialogModalTitle>Tutorial de Uso</DialogModalTitle>
                      </DialogModalHeader>
                      <ScrollArea className="h-96 pr-6">
                          <div className="text-sm text-muted-foreground space-y-4">
                              <p>¡Bienvenido a Deportes para Todos! Esta guía te ayudará a sacar el máximo provecho de la plataforma.</p>
                              <h3 className="font-bold text-foreground">1. Navegación Principal</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                  <li><span className="font-semibold">Barra de Búsqueda:</span> Ubicada en la parte superior, te permite buscar eventos o canales por nombre. Los resultados aparecerán al instante.</li>
                                  <li><span className="font-semibold">Carrusel de Categorías:</span> Desplázate horizontalmente para ver todas las categorías disponibles como "En Vivo", "Fútbol", "Canales", etc. Haz clic en una para ver todos sus eventos.</li>
                                  <li><span className="font-semibold">Carruseles de Eventos:</span> En la vista de escritorio, los eventos están organizados por estado ("En Vivo", "Próximos", etc.) en carruseles que puedes deslizar.</li>
                              </ul>
                              <h3 className="font-bold text-foreground">2. Seleccionar Eventos para Ver</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                  <li><span className="font-semibold">Haz clic en una Tarjeta:</span> Cuando encuentres un evento o canal que te interese, haz clic en su tarjeta.</li>
                                  <li><span className="font-semibold">Elige una Opción:</span> Se abrirá un diálogo con uno o más botones. Cada botón representa una fuente de transmisión diferente. Elige la que prefieras.</li>
                                  <li><span className="font-semibold">Asignación a Ventana:</span> Al seleccionar una opción, el evento se asigna automáticamente a la primera "ventana" de visualización disponible (tienes hasta 9).</li>
                              </ul>
                              <h3 className="font-bold text-foreground">3. Gestionar tus Eventos Seleccionados</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                  <li><span className="font-semibold">Botón "Configuración" (rueda dentada):</span> En la esquina superior derecha, este botón abre un panel donde puedes ver y gestionar tus eventos elegidos.</li>
                                  <li><span className="font-semibold">Modificar o Eliminar:</span> Desde este panel, puedes hacer clic en un evento para cambiar la fuente de transmisión o para eliminarlo de tu selección. También puedes reordenar los eventos.</li>
                              </ul>
                              <h3 className="font-bold text-foreground">4. Iniciar la Vista Múltiple</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                  <li><span className="font-semibold">Botón "Play":</span> Una vez que hayas seleccionado al menos un evento, este botón se activará. Haz clic en él para ir a la pantalla de visualización.</li>
                                  <li><span className="font-semibold">Cuadrícula Dinámica:</span> La pantalla se dividirá automáticamente para mostrar todos los eventos que seleccionaste. La cuadrícula se adapta de 1 a 9 ventanas.</li>
                              </ul>
                          </div>
                      </ScrollArea>
                      <DialogModalFooter>
                          <DialogClose asChild><Button>Entendido</Button></DialogClose>
                      </DialogModalFooter>
                  </DialogContent>
              </Dialog>
              <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                          <AlertCircle />
                          Errores y Soluciones
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                      <DialogModalHeader>
                          <DialogModalTitle>Solución de Errores Comunes</DialogModalTitle>
                      </DialogModalHeader>
                      <ScrollArea className="h-96 pr-6">
                          <div className="text-sm text-muted-foreground space-y-4">
                              <p>A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes. Sigue estos pasos en orden para maximizar las chances de éxito.</p>
                              <h3 className="font-bold text-foreground">1. Configurar un DNS público</h3>
                              <p>Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios. Cambiar el DNS de tu dispositivo a uno público como el de Cloudflare (1.1.1.1) o Google (8.8.8.8) puede saltarse estas restricciones.</p>
                              <h3 className="font-bold text-foreground">2. Instalar una Extensión de Reproductor de Video</h3>
                              <p>Algunos streams usan formatos (M3U8) que no todos los navegadores soportan de forma nativa. Instalar una extensión como "Reproductor MPD/M3U8/M3U/EPG" para Chrome/Edge puede solucionar esto.</p>
                              <h3 className="font-bold text-foreground">3. Desactivar Bloqueadores de Anuncios</h3>
                              <p>Los Adblockers a veces pueden bloquear los reproductores de video. Intenta desactivar tu Adblocker temporalmente para este sitio.</p>
                          </div>
                      </ScrollArea>
                      <DialogModalFooter>
                          <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                      </DialogModalFooter>
                  </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                        <FileText />
                        Aviso Legal
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogModalHeader>
                        <DialogModalTitle>Descargo de Responsabilidad</DialogModalTitle>
                    </DialogModalHeader>
                    <ScrollArea className="h-96 pr-6">
                        <div className="text-sm text-muted-foreground space-y-4">
                            <p>Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos de terceros. No alojamos ni retransmitimos ninguna señal. Cualquier infracción potencial corresponde a los proveedores externos.</p>
                            <p>Todas las marcas y logotipos son propiedad de sus respectivos dueños y se utilizan con fines informativos. El acceso y uso de la página se realiza bajo responsabilidad del usuario.</p>
                        </div>
                    </ScrollArea>
                    <DialogModalFooter>
                        <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                    </DialogModalFooter>
                </DialogContent>
            </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                        <Mail />
                        Contacto
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogModalHeader>
                        <DialogModalTitle>Contacto</DialogModalTitle>
                    </DialogModalHeader>
                    <div className="text-sm text-muted-foreground py-4">
                        <p>¿Tienes alguna sugerencia o encontraste un error? Contáctanos a nuestro correo para ayudarnos a mejorar.</p>
                    </div>
                    <DialogModalFooter>
                        <a href="mailto:deportesparatodosvercel@gmail.com" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                            Contactar
                        </a>
                    </DialogModalFooter>
                </DialogContent>
            </Dialog>
          </div>
        </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
