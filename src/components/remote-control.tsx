
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Ably from 'ably';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, X, Airplay } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import { EventSelectionDialog } from './event-selection-dialog';
import { AddEventsDialog } from './add-events-dialog';
import { ScheduleManager } from './schedule-manager';
import type { Event } from './event-carousel';
import type { Channel } from './channel-list';
import type { Schedule } from './schedule-manager';

// --- TYPE DEFINITIONS ---

interface RemoteControlViewState {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  fullscreenIndex: number | null;
  schedules: Schedule[];
}

const initialRemoteState: RemoteControlViewState = {
  selectedEvents: Array(9).fill(null),
  viewOrder: Array.from({ length: 9 }, (_, i) => i),
  gridGap: 0,
  borderColor: '#000000',
  isChatEnabled: true,
  fullscreenIndex: null,
  schedules: [],
};

type RemoteControlManagerProps = 
  | {
      mode: 'inactive';
      onStartControlling: (code: string) => void;
      onActivateControlledMode: () => void;
      remoteSessionId: string | null;
    }
  | {
      mode: 'controlling';
      initialRemoteSessionId: string | null;
      onSessionEnd: () => void;
      allEvents: Event[];
      allChannels: Channel[];
      updateAllEvents: (events: Event[]) => void;
    }
  | {
      mode: 'controlled';
      viewState: RemoteControlViewState;
      setViewState: (newState: RemoteControlViewState) => void;
      onSessionStart: (sessionId: string) => void;
      onSessionEnd: () => void;
      onReload: (index: number) => void;
      onToggleFullscreen: (index: number) => void;
    };


// --- MAIN COMPONENT ---

export function RemoteControlManager(props: RemoteControlManagerProps) {
  const ablyRef = useRef<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null }>({ client: null, channel: null });

  const cleanupAbly = useCallback(() => {
    const { client, channel } = ablyRef.current;
    if (client && client.connection.state !== 'closed') {
        channel?.presence.leave().catch(err => console.error("Error leaving presence:", err));
        channel?.detach().catch(err => console.error("Error detaching channel:", err));
        client.close();
    }
    ablyRef.current = { client: null, channel: null };
  }, []);

  useEffect(() => {
    // Global cleanup on unmount
    return () => cleanupAbly();
  }, [cleanupAbly]);

  switch (props.mode) {
    case 'inactive':
      return <InactiveView {...props} />;
    case 'controlling':
      return <ControllingView {...props} ablyRef={ablyRef} cleanupAbly={cleanupAbly} />;
    case 'controlled':
      return <ControlledView {...props} ablyRef={ablyRef} cleanupAbly={cleanupAbly} />;
    default:
      return null;
  }
}


// --- INACTIVE MODE COMPONENT ---

function InactiveView({ onActivateControlledMode, onStartControlling }: Extract<RemoteControlManagerProps, { mode: 'inactive' }>) {
  const [dialogView, setDialogView] = useState<'main' | 'controlling'>('main');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartControlling = () => {
    if (!code || code.length !== 4) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un código de 4 dígitos válido.' });
      return;
    }
    setIsLoading(true);
    onStartControlling(code);
  };
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialogView === 'main' ? 'Control Remoto' : 'Controlar Dispositivo'}</DialogTitle>
        <DialogDescription>
          {dialogView === 'main' 
            ? 'Controla la aplicación desde otro dispositivo o permite que este dispositivo sea controlado.'
            : 'Introduce el código de 4 dígitos que aparece en el otro dispositivo.'}
        </DialogDescription>
      </DialogHeader>

      {dialogView === 'main' ? (
        <div className="space-y-4 py-4">
          <Button onClick={onActivateControlledMode} size="lg" className="w-full">Ser Controlado</Button>
          <Button onClick={() => setDialogView('controlling')} variant="outline" size="lg" className="w-full">Controlar Otro Dispositivo</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              maxLength={4}
              className="text-center text-2xl h-14 tracking-widest font-mono"
            />
            <Button onClick={handleStartControlling} disabled={isLoading} size="lg" className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setDialogView('main')}>Volver</Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}


// --- CONTROLLED MODE (BACKGROUND) COMPONENT ---

function ControlledView({ viewState, setViewState, onSessionStart, onSessionEnd, onReload, onToggleFullscreen, ablyRef, cleanupAbly }: Extract<RemoteControlManagerProps, { mode: 'controlled' }> & { ablyRef: any, cleanupAbly: () => void }) {
    useEffect(() => {
        let isMounted = true;
        const startSession = async () => {
            cleanupAbly(); // Ensure no old connections are lingering
            const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=controlled-${Date.now()}` });
            
            client.connection.on('connected', () => {
                if (!isMounted) {
                    client.close();
                    return;
                }

                const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                const channel = client.channels.get(`remote-control:${newCode}`);
                
                ablyRef.current = { client, channel };
                onSessionStart(newCode);

                channel.subscribe('control-action', (message: Ably.Types.Message) => {
                    const { action, payload } = message.data;
                    if (action === 'requestInitialState') {
                        channel.publish('control-action', { action: 'initialState', payload: viewState });
                    }
                    if (action === 'updateState') {
                        setViewState(payload);
                    }
                    if (action === 'reload') {
                        onReload(payload.index);
                    }
                    if (action === 'toggleFullscreen') {
                        onToggleFullscreen(payload.index);
                    }
                });

                channel.presence.subscribe('leave', () => {
                    if(isMounted) {
                        onSessionEnd();
                    }
                });
            });

             client.connection.on('closed', () => {
                if(isMounted) {
                    onSessionEnd();
                }
            });
             client.connection.on('failed', (error: Ably.Types.ErrorInfo) => {
                console.error("Ably connection failed:", error);
                if (isMounted) {
                    onSessionEnd();
                }
            });
        };

        startSession();

        return () => {
            isMounted = false;
            onSessionEnd();
            cleanupAbly();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null; // This component has no UI, it only manages the connection
}

// --- CONTROLLING MODE COMPONENT ---

function ControllingView({ initialRemoteSessionId, onSessionEnd, allEvents, allChannels, updateAllEvents, ablyRef, cleanupAbly }: Extract<RemoteControlManagerProps, { mode: 'controlling' }> & { ablyRef: any, cleanupAbly: () => void }) {
  const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogs, setDialogs] = useState({
      addEvents: false,
      schedule: false,
      modifyEvent: null as { event: Event, index: number } | null,
      sessionEnded: false,
      isContactOpen: false,
      isLegalOpen: false,
      isTutorialOpen: false,
      isErrorsOpen: false,
      notificationManager: false,
      calendar: false,
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();

  const publishAction = useCallback((action: string, payload: any) => {
    const { channel } = ablyRef.current;
    if (channel) {
      channel.publish('control-action', { action, payload });
    }
  }, [ablyRef]);

  useEffect(() => {
    let isMounted = true;
    let connectionTimeout: NodeJS.Timeout;

    const connectAndSync = async () => {
        cleanupAbly();
        if (!initialRemoteSessionId) {
            toast({ variant: "destructive", title: "Error", description: "No se proporcionó un código de sesión." });
            onSessionEnd();
            return;
        }

        try {
            const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=controlling-${Date.now()}` });
            client.connection.on('connected', async () => {
                if (!isMounted) { client.close(); return; }

                const channel = client.channels.get(`remote-control:${initialRemoteSessionId}`);
                ablyRef.current = { client, channel };

                connectionTimeout = setTimeout(() => {
                    if (isLoading) {
                        toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo conectar. Verifica el código e inténtalo de nuevo.' });
                        onSessionEnd();
                    }
                }, 10000);

                channel.subscribe('control-action', (message: Ably.Types.Message) => {
                    if (message.data.action === 'initialState') {
                        clearTimeout(connectionTimeout);
                        setRemoteState(message.data.payload);
                        setIsLoading(false);
                    }
                });

                await channel.presence.enter();
                publishAction('requestInitialState', {});
            });

             client.connection.on('closed', () => {
                if (isMounted) {
                    setDialogs(d => ({ ...d, sessionEnded: true }));
                }
            });
            client.connection.on('failed', (error: Ably.Types.ErrorInfo) => {
                console.error("Ably connection failed:", error);
                toast({ variant: 'destructive', title: 'Error de Conexión', description: 'La conexión falló.' });
                if (isMounted) {
                    onSessionEnd();
                }
            });

        } catch (error) {
            console.error(error);
            clearTimeout(connectionTimeout);
            toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo iniciar la conexión con Ably.' });
            onSessionEnd();
        }
    };
    
    connectAndSync();

    return () => {
        isMounted = false;
        clearTimeout(connectionTimeout);
        cleanupAbly();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRemoteSessionId]);

  const updateAndPublish = (newState: Partial<RemoteControlViewState>) => {
    setRemoteState(prevState => {
      const updatedState = { ...(prevState || initialRemoteState), ...newState };
      publishAction('updateState', updatedState);
      return updatedState;
    });
  };

  if (isLoading) return <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  
  if (!remoteState) return (
      <div className="fixed inset-0 bg-background z-50 p-4 text-center flex flex-col justify-center items-center">
        <p className='text-destructive'>No se pudo cargar el estado remoto.</p>
        <Button onClick={onSessionEnd} className='mt-4'>Cerrar</Button>
      </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <header className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Control Remoto</h1>
            <p className="text-sm text-muted-foreground">Sesión: {initialRemoteSessionId}</p>
          </div>
          <Button variant="destructive" onClick={onSessionEnd}>
            <X className="mr-2 h-4 w-4" /> Terminar
          </Button>
        </header>

        <div className="flex-grow overflow-y-auto">
          <LayoutConfigurator
            remoteControlMode="controlling"
            order={remoteState.viewOrder.filter(i => remoteState.selectedEvents[i] !== null)}
            onOrderChange={(newOrder) => {
                const fullOrder = [...newOrder];
                const presentIndexes = new Set(newOrder);
                for (let i = 0; i < 9; i++) {
                  if (!presentIndexes.has(i)) {
                    fullOrder.push(i);
                  }
                }
                updateAndPublish({ viewOrder: fullOrder });
            }}
            eventDetails={remoteState.selectedEvents}
            onRemove={(index) => {
                const newEvents = [...remoteState.selectedEvents];
                newEvents[index] = null;
                updateAndPublish({ selectedEvents: newEvents });
            }}
            onReload={(index) => publishAction('reload', { index })}
            onModify={(event, index) => setDialogs(d => ({ ...d, modifyEvent: { event, index } }))}
            onToggleFullscreen={(index) => {
                const newIndex = remoteState.fullscreenIndex === index ? null : index;
                updateAndPublish({ fullscreenIndex: newIndex });
            }}
            fullscreenIndex={remoteState.fullscreenIndex}
            isViewPage={true}
            onAddEvent={() => setDialogs(d => ({ ...d, addEvents: true }))}
            gridGap={remoteState.gridGap}
            onGridGapChange={(value) => updateAndPublish({ gridGap: value })}
            borderColor={remoteState.borderColor}
            onBorderColorChange={(value) => updateAndPublish({ borderColor: value })}
            onRestoreGridSettings={() => updateAndPublish({ gridGap: 0, borderColor: '#000000' })}
            isChatEnabled={remoteState.isChatEnabled}
            onIsChatEnabledChange={(value) => updateAndPublish({ isChatEnabled: value })}
            categories={[]}
            onActivateControlledMode={() => {}}
            onSchedule={() => setDialogs(d => ({...d, schedule: true}))}
            onOpenCalendar={() => setDialogs(d => ({ ...d, calendar: true}))}
            onIsErrorsOpenChange={(open) => setDialogs(d => ({...d, isErrorsOpen: open}))} isErrorsOpen={dialogs.isErrorsOpen}
            onIsTutorialOpenChange={(open) => setDialogs(d => ({...d, isTutorialOpen: open}))} isTutorialOpen={dialogs.isTutorialOpen}
            onOpenErrors={() => setDialogs(d => ({...d, isErrorsOpen: true}))} 
            onOpenTutorial={() => setDialogs(d => ({...d, isTutorialOpen: true}))}
            onNotificationManager={() => setDialogs(d => ({...d, notificationManager: true}))}
          />
        </div>
      </div>
      
      {/* --- DIALOGS --- */}
      <Dialog open={dialogs.sessionEnded} onOpenChange={() => { setDialogs(d => ({ ...d, sessionEnded: false })); onSessionEnd(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesión Terminada</DialogTitle>
            <DialogDescription>La conexión con el otro dispositivo ha finalizado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button onClick={onSessionEnd}>Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!dialogs.modifyEvent} onOpenChange={(open) => !open && setDialogs(d => ({ ...d, modifyEvent: null }))}>
        {dialogs.modifyEvent && (
          <EventSelectionDialog
              isOpen={!!dialogs.modifyEvent}
              onOpenChange={() => setDialogs(d => ({ ...d, modifyEvent: null }))}
              event={dialogs.modifyEvent.event}
              onSelect={(event, option) => {
                  const newEvents = [...remoteState.selectedEvents];
                  newEvents[dialogs.modifyEvent!.index] = { ...event, selectedOption: option };
                  updateAndPublish({ selectedEvents: newEvents });
                  setDialogs(d => ({...d, modifyEvent: null}));
              }}
              isModification={true}
              onRemove={() => {
                  const newEvents = [...remoteState.selectedEvents];
                  newEvents[dialogs.modifyEvent!.index] = null;
                  updateAndPublish({ selectedEvents: newEvents });
                  setDialogs(d => ({...d, modifyEvent: null}));
              }}
              isLoading={false}
              setIsLoading={()=>{}}
              setEventForDialog={()=>{}}
          />
        )}
      </Dialog>
      
      <AddEventsDialog
        open={dialogs.addEvents}
        onOpenChange={(open) => setDialogs(d => ({...d, addEvents: open}))}
        onSelect={(event, option) => {
            const newEvents = [...remoteState.selectedEvents];
            const emptyIndex = newEvents.findIndex(e => e === null);
            if (emptyIndex !== -1) {
                newEvents[emptyIndex] = { ...event, selectedOption: option };
                updateAndPublish({ selectedEvents: newEvents });
            } else {
                toast({ title: "Máximo alcanzado", description: "No se pueden añadir más de 9 eventos."});
            }
            setDialogs(d => ({...d, addEvents: false}));
        }}
        onRemove={(event) => {
             const newEvents = remoteState.selectedEvents.map(se => se?.id === event.id ? null : se);
             updateAndPublish({ selectedEvents: newEvents });
        }}
        selectedEvents={remoteState.selectedEvents}
        allEvents={allEvents}
        allChannels={allChannels}
        onFetchEvents={async () => {}} // No fetch needed in remote
        updateAllEvents={updateAllEvents}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
      />
      
      <ScheduleManager 
        open={dialogs.schedule}
        onOpenChange={(open) => setDialogs(d => ({...d, schedule: open}))}
        currentSelection={remoteState.selectedEvents}
        currentOrder={remoteState.viewOrder}
        schedules={remoteState.schedules}
        onSchedulesChange={(newSchedules) => updateAndPublish({ schedules: newSchedules })}
        onModifyEventInView={(event, index) => setDialogs(d => ({...d, modifyEvent: {event, index}}))}
        isLoading={false}
        onAddEvent={() => setDialogs(d => ({...d, addEvents: true, schedule: false}))}
        initialSelection={remoteState.selectedEvents}
        initialOrder={remoteState.viewOrder}
        setFutureSelection={(s) => updateAndPublish({ selectedEvents: s})}
        setFutureOrder={(o) => updateAndPublish({ viewOrder: o })}
      />
    </>
  );
}
