
'use client';

import { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Realtime } from 'ably';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Copy, Check, X } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import type { Schedule } from './schedule-manager';
import { LayoutConfigurator } from './layout-configurator';
import type { Channel } from './channel-list';
import { EventSelectionDialog } from './event-selection-dialog';
import { ScheduleManager } from './schedule-manager';
import { NotificationManager } from './notification-manager';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Airplay } from 'lucide-react';


type AppState = {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  schedules: Schedule[];
};

type RemoteControlManagerProps = {
  appState: AppState;
  setAppState: (newState: Partial<AppState>) => void;
  allEvents: Event[];
  allChannels: Channel[];
};

type AblyMessage = {
  name: string;
  data: any;
};

// --- Main Component ---
export const RemoteControlManager = forwardRef((props: RemoteControlManagerProps, ref) => {
  const { appState, setAppState, allEvents, allChannels } = props;
  const [mode, setMode] = useState<'inactive' | 'controlled' | 'controlling'>('inactive');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isControllerPromptOpen, setIsControllerPromptOpen] = useState(false);
  const [controllerCode, setControllerCode] = useState('');

  
  const ablyClientRef = useRef<Realtime | null>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();

  const cleanupAbly = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.detach();
    }
    if (ablyClientRef.current) {
      ablyClientRef.current.close();
    }
    channelRef.current = null;
    ablyClientRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupAbly();
    };
  }, [cleanupAbly]);
  
  const initializeAbly = async (clientId: string) => {
    try {
        const client = new Realtime({ 
            authUrl: `/api/ably?clientId=${encodeURIComponent(clientId)}`,
            echoMessages: false 
        });
        ablyClientRef.current = client;
        return client;
    } catch (e) {
        console.error("Ably initialization failed", e);
        setError("Failed to connect to the real-time service.");
        throw e;
    }
  };


  const startControlledSession = async () => {
    if (ablyClientRef.current) cleanupAbly();
    setIsConnecting(true);
    setError(null);
    try {
      const newSessionId = `dpt-${Math.random().toString(36).substring(2, 8)}`;
      setSessionId(newSessionId);
      const ably = await initializeAbly(`controlled-${newSessionId}`);
      
      ably.connection.on('connected', () => {
        setMode('controlled');
        setIsConnecting(false);
        const channel = ably.channels.get(newSessionId);
        channelRef.current = channel;

        channel.subscribe('sync-request', () => {
          channel.publish('state-update', appState);
        });

        channel.subscribe('action', (message: AblyMessage) => {
          if (message.data.type === 'SET_APP_STATE') {
            setAppState(message.data.payload);
          }
        });
        
        channel.publish('state-update', appState);
      });
      
      ably.connection.on('failed', (error) => {
          setError(error.reason.message);
          setIsConnecting(false);
          setMode('inactive');
      });

    } catch (e) {
      setIsConnecting(false);
      setMode('inactive');
    }
  };
  
  const startControllingSession = async (code: string) => {
    if (ablyClientRef.current) cleanupAbly();
    if (!code) {
        toast({ variant: 'destructive', title: "Error", description: "Por favor, introduce un código de sesión." });
        return;
    }
    setIsConnecting(true);
    setError(null);
    try {
        const ably = await initializeAbly(`controller-${code}`);
        ably.connection.on('connected', () => {
            const channel = ably.channels.get(code);
            channelRef.current = channel;

            channel.subscribe('state-update', (message: AblyMessage) => {
                setAppState(message.data);
            });

            channel.publish('sync-request', {});
            setMode('controlling');
            setIsConnecting(false);
            toast({ title: "Control Remoto Conectado", description: `Controlando la sesión ${code}.` });
        });

        ably.connection.on('failed', (error) => {
            setError(error.reason.message || "No se pudo conectar a la sesión.");
            setIsConnecting(false);
            setMode('inactive');
        });

    } catch (e) {
        setIsConnecting(false);
        setMode('inactive');
    }
  };

  const stopSession = () => {
    cleanupAbly();
    if(mode === 'controlling') {
        toast({ title: "Control Remoto Desconectado" });
    }
    setMode('inactive');
    setSessionId('');
    setError(null);
    setIsConnecting(false);
  };
  
  useImperativeHandle(ref, () => ({
    startControlledSession,
    startControllingSession,
    openControllerPrompt: () => setIsControllerPromptOpen(true),
  }));

  if (mode === 'controlling') {
    return (
      <ControllingView
          onStop={stopSession}
          appState={appState}
          onAction={(payload) => channelRef.current?.publish('action', { name: 'SET_APP_STATE', data: { type: 'SET_APP_STATE', payload }})}
          allEvents={allEvents}
          allChannels={allChannels}
      />
    );
  }

  return (
      <>
        <Dialog open={mode === 'controlled'} onOpenChange={(isOpen) => !isOpen && stopSession()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Control Remoto Activado</DialogTitle>
                </DialogHeader>
                {isConnecting ? (
                  <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : error ? (
                   <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error de Conexión</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                ) : (
                    <ControlledView sessionId={sessionId} onStop={stopSession} />
                )}
            </DialogContent>
        </Dialog>
        
        <Dialog open={isControllerPromptOpen} onOpenChange={setIsControllerPromptOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Controlar Dispositivo</DialogTitle>
                    <DialogDescription>Introduce el código del dispositivo que quieres controlar.</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 py-4">
                    <Input
                        placeholder="Código de sesión..."
                        value={controllerCode}
                        onChange={(e) => setControllerCode(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        startControllingSession(controllerCode);
                        setIsControllerPromptOpen(false);
                    }}>Conectar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
  );
});

RemoteControlManager.displayName = 'RemoteControlManager';

// --- UI Components for different modes ---

function ControlledView({ sessionId, onStop }: { sessionId: string, onStop: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(sessionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4 pt-4">
            <p className="text-sm text-center text-muted-foreground">Este dispositivo ahora puede ser controlado. Introduce el siguiente código en el dispositivo que quieras usar como mando:</p>
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg">
                <span className="text-2xl font-bold tracking-widest">{sessionId}</span>
                <Button size="icon" variant="ghost" onClick={handleCopy}>
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </Button>
            </div>
            <Button variant="outline" onClick={onStop} className="w-full">Detener Control Remoto</Button>
        </div>
    )
}


function ControllingView({ onStop, appState, onAction, allEvents, allChannels }: any) {
  const [openDialog, setOpenDialog] = useState<null | 'add-event' | 'schedule' | 'notification'>(null);

  // States for dialogs
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);

  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
  const [futureOrder, setFutureOrder] = useState<number[]>([]);
  
  const handleModifyEvent = (event: Event, index: number) => {
    const currentEventState = appState.selectedEvents[index];
    if (!currentEventState) return;

    const eventForModification = {
      ...event,
      selectedOption: currentEventState.selectedOption,
    };
    
    setDialogEvent(eventForModification);
    setIsModification(true);
    setModificationIndex(index);
    setOpenDialog('add-event');
  };

  const handleAddEvent = () => {
    setDialogEvent(null);
    setIsModification(false);
    setModificationIndex(appState.selectedEvents.findIndex((e: any) => e === null));
    setOpenDialog('add-event');
  };
  
  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...appState.selectedEvents];
    let targetIndex = modificationIndex;

    if (targetIndex !== -1 && targetIndex !== null) {
      newSelectedEvents[targetIndex] = { ...event, selectedOption: optionUrl };
      onAction({ selectedEvents: newSelectedEvents });
    }
    setOpenDialog(null);
  };
  
  const handleRemoveEvent = (indexToRemove: number) => {
    const newSelectedEvents = [...appState.selectedEvents];
    newSelectedEvents[indexToRemove] = null;
    onAction({ selectedEvents: newSelectedEvents });
  };
  
  const handleRemoveFromDialog = () => {
    if(modificationIndex !== null){
        const newSelectedEvents = [...appState.selectedEvents];
        newSelectedEvents[modificationIndex] = null;
        onAction({ selectedEvents: newSelectedEvents });
        setOpenDialog(null);
    }
  }

  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    [...allEvents].forEach(event => {
        if (event.category) categorySet.add(event.category);
    });
    return Array.from(categorySet).sort();
  }, [allEvents]);

  return (
    <>
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="flex items-center justify-between p-2 border-b flex-shrink-0">
          <h2 className="font-semibold">Control Remoto</h2>
          <Button variant="destructive" size="sm" onClick={onStop}>
            <X className="mr-2 h-4 w-4" /> Desconectar
          </Button>
        </header>
        <div className="flex-grow overflow-y-auto">
            <LayoutConfigurator
              order={appState.viewOrder.filter((i: number) => appState.selectedEvents[i] !== null)}
              onOrderChange={(newOrder: number[]) => onAction({ viewOrder: newOrder })}
              eventDetails={appState.selectedEvents}
              onRemove={handleRemoveEvent}
              onModify={handleModifyEvent}
              isViewPage={true}
              onAddEvent={handleAddEvent}
              onSchedule={() => setOpenDialog('schedule')}
              onNotificationManager={() => setOpenDialog('notification')}
              gridGap={appState.gridGap}
              onGridGapChange={(value: number) => onAction({ gridGap: value })}
              borderColor={appState.borderColor}
              onBorderColorChange={(value: string) => onAction({ borderColor: value })}
              isChatEnabled={appState.isChatEnabled}
              onIsChatEnabledChange={(value: boolean) => onAction({ isChatEnabled: value })}
              categories={allCategories}
              onRestoreGridSettings={() => onAction({ gridGap: 0, borderColor: '#000000' })}
              onOpenTutorial={() => {}}
              onOpenErrors={() => {}}
              onOpenCalendar={() => {}}
              isTutorialOpen={false}
              onIsTutorialOpenChange={() => {}}
              isErrorsOpen={false}
              onIsErrorsOpenChange={() => {}}
            />
        </div>
      </div>
      
      {dialogEvent && (
        <EventSelectionDialog
          isOpen={openDialog === 'add-event'}
          onOpenChange={(isOpen) => !isOpen && setOpenDialog(null)}
          event={dialogEvent}
          onSelect={handleEventSelect}
          isModification={isModification}
          onRemove={handleRemoveFromDialog}
          isLoading={false}
          setIsLoading={() => {}}
          setEventForDialog={setDialogEvent}
          updateEventsList={() => {}}
        />
      )}
      
      <ScheduleManager
          open={openDialog === 'schedule'}
          onOpenChange={(isOpen) => !isOpen && setOpenDialog(null)}
          currentSelection={futureSelection}
          currentOrder={futureOrder}
          schedules={appState.schedules}
          onSchedulesChange={(newSchedules) => onAction({ schedules: newSchedules })}
          onModifyEventInView={() => {}}
          isLoading={false}
          onAddEvent={() => {}}
          initialSelection={appState.selectedEvents}
          initialOrder={appState.viewOrder}
          setFutureSelection={setFutureSelection}
          setFutureOrder={setFutureOrder}
      />
      
      <NotificationManager
        open={openDialog === 'notification'}
        onOpenChange={(isOpen) => !isOpen && setOpenDialog(null)}
        allCategories={allCategories}
      />
    </>
  );
}
