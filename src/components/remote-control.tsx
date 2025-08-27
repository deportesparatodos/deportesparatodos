

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
import { Loader2, AlertCircle, Copy, Check, X, Airplay, Maximize, Minimize } from 'lucide-react';
import type { Event, StreamOption } from './event-carousel';
import type { Schedule } from './schedule-manager';
import { LayoutConfigurator } from './layout-configurator';
import type { Channel } from './channel-list';
import { EventSelectionDialog } from './event-selection-dialog';
import { ScheduleManager } from './schedule-manager';
import { NotificationManager } from './notification-manager';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AddEventsDialog } from './add-events-dialog';


type AppState = {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  schedules: Schedule[];
  fullscreenIndex: number | null;
};

type RemoteControlManagerProps = {
  appState: AppState;
  setAppState: (newState: AppState) => void;
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
  
  const ablyClientRef = useRef<Realtime | null>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();

  const cleanupAbly = useCallback(() => {
    if (channelRef.current) {
        try {
            channelRef.current.detach();
        } catch (e) {
            console.error("Error detaching from Ably channel:", e);
        }
    }
    if (ablyClientRef.current) {
        try {
            const state = ablyClientRef.current.connection.state;
            if (state === 'connecting' || state === 'connected' || state === 'suspended') {
                ablyClientRef.current.close();
            }
        } catch (e) {
            console.error("Error closing Ably connection:", e);
        }
    }
    channelRef.current = null;
    ablyClientRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupAbly();
    };
  }, [cleanupAbly]);
  
  const initializeAbly = (clientId: string): Promise<Realtime> => {
    return new Promise(async (resolve, reject) => {
      try {
          const response = await fetch('/api/ably');
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch Ably API key.');
          }
          const { apiKey } = await response.json();

          if (!apiKey) {
              throw new Error("La clave de API de Ably no está configurada.");
          }

          const client = new Realtime({
              key: apiKey,
              clientId: clientId,
              echoMessages: false
          });

          ablyClientRef.current = client;
          resolve(client);
      } catch (e: any) {
          const errorMessage = e.message || "No se pudo conectar al servicio en tiempo real.";
          setError(errorMessage);
          toast({
              variant: 'destructive',
              title: 'Error de Conexión',
              description: errorMessage,
          });
          reject(e);
      }
  });
};


 const startControlledSession = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        if (ablyClientRef.current?.connection.state === 'connected') cleanupAbly();
        
        setIsConnecting(true);
        setError(null);
        
        try {
            const newSessionId = `dpt-${Math.random().toString(36).substring(2, 6)}`;
            const ably = await initializeAbly(`controlled-${newSessionId}`);
            
            ably.connection.once('connected', () => {
                setSessionId(newSessionId);
                setMode('controlled');
                setIsConnecting(false);
                sessionStorage.setItem('isControlledSession', 'true');
                
                const channel = ably.channels.get(newSessionId);
                channelRef.current = channel;

                channel.subscribe('sync-request', () => {
                    channel.publish('state-update', { appState });
                });

                channel.subscribe('action', (message: AblyMessage) => {
                    if (message.data.type === 'SET_APP_STATE') {
                        window.dispatchEvent(new CustomEvent('remote-state-update', { detail: { newState: message.data.payload } }));
                    }
                });
                
                channel.publish('state-update', { appState });
                resolve(newSessionId); 
            });
            
            ably.connection.once('failed', (error) => {
                setError(error.reason.message);
                setIsConnecting(false);
                setMode('inactive');
                reject(new Error(error.reason.message || "No se pudo activar el control remoto."));
            });

        } catch (e: any) {
            setIsConnecting(false);
            setMode('inactive');
            reject(e);
        }
    });
};

  
  const startControllingSession = async (code: string) => {
    if (ablyClientRef.current?.connection.state === 'connected') cleanupAbly();
    if (!code) {
        toast({ variant: 'destructive', title: "Error", description: "Por favor, introduce un código de sesión." });
        return;
    }
    setIsConnecting(true);
    setError(null);
    try {
        const ably = await initializeAbly(`controller-${code}`);

        const connectionTimeout = setTimeout(() => {
            if (mode !== 'controlling') {
                setIsConnecting(false);
                setMode('inactive');
                toast({ variant: 'destructive', title: "Error de Conexión", description: "No se pudo conectar a la sesión. Verifica el código e inténtalo de nuevo." });
                cleanupAbly();
            }
        }, 15000); // 15 second timeout

        ably.connection.once('connected', () => {
            clearTimeout(connectionTimeout);
            const channel = ably.channels.get(code);
            channelRef.current = channel;

            channel.subscribe('state-update', (message: AblyMessage) => {
                setAppState(message.data.appState);
            });

            channel.publish('sync-request', {});
            setMode('controlling');
            setIsConnecting(false);
            toast({ title: "Control Remoto Conectado", description: `Controlando la sesión ${code}.` });
        });

        ably.connection.once('failed', (error) => {
            clearTimeout(connectionTimeout);
            setError(error.reason.message || "No se pudo conectar a la sesión.");
            setIsConnecting(false);
            setMode('inactive');
            toast({ variant: 'destructive', title: "Error de Conexión", description: error.reason.message || "No se pudo conectar a la sesión. Verifica el código." });
        });

    } catch (e: any) {
        setIsConnecting(false);
        setMode('inactive');
        toast({ variant: 'destructive', title: "Error", description: e.message || "Ocurrió un error inesperado." });
    }
  };

  const stopSession = () => {
    cleanupAbly();
    if(mode === 'controlling') {
        toast({ title: "Control Remoto Desconectado" });
    }
    if (mode === 'controlled') {
        sessionStorage.removeItem('isControlledSession');
    }
    setMode('inactive');
    setSessionId('');
    setError(null);
    setIsConnecting(false);
  };
  
  useImperativeHandle(ref, () => ({
    startControlledSession,
    startControllingSession,
  }));
  
  const handleAction = (newState: Partial<AppState>) => {
      const updatedState = { ...appState, ...newState };
      // Update local state for immediate feedback
      setAppState(updatedState as AppState); 
      // Publish the new state to the controlled device
      channelRef.current?.publish('action', { 
        type: 'SET_APP_STATE', 
        payload: updatedState 
      });
  };

  if (mode === 'controlling') {
    return (
      <ControllingView
          onStop={stopSession}
          appState={appState}
          onAction={handleAction}
          allEvents={allEvents}
          allChannels={allChannels}
      />
    );
  }

  return null;
});

RemoteControlManager.displayName = 'RemoteControlManager';


function ControllingView({ onStop, appState, onAction, allEvents, allChannels }: any) {
    // Dialog states
    const [isAddEventOpen, setIsAddEventOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isEventSelectionOpen, setIsEventSelectionOpen] = useState(false);
    
    // Data for dialogs
    const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
    const [isModification, setIsModification] = useState(false);
    const [modificationIndex, setModificationIndex] = useState<number | null>(null);
    const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
    const [futureOrder, setFutureOrder] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateState = (newState: Partial<AppState>) => {
        const fullNewState = { ...appState, ...newState };
        onAction(fullNewState);
    };

    const handleOpenDialog = (dialogType: 'add-event' | 'schedule' | 'event-selection', data?: any) => {
        if (dialogType === 'add-event') setIsAddEventOpen(true);
        if (dialogType === 'schedule') setIsScheduleOpen(true);
        if (dialogType === 'event-selection') {
            setDialogEvent(data.event);
            setIsModification(data.isModification);
            setModificationIndex(data.modificationIndex);
            setIsEventSelectionOpen(true);
        }
    };
    
    const allCategories = useMemo(() => {
        const categorySet = new Set<string>();
        [...allEvents].forEach(event => {
            if (event.category) categorySet.add(event.category);
        });
        return Array.from(categorySet).sort();
    }, [allEvents]);
    
    const getSelectionForDialog = (event: Event) => {
        if (!appState.selectedEvents) return { isSelected: false, selectedOption: null };
        const selectionIndex = appState.selectedEvents.findIndex((se: Event | null) => se?.id === event.id);
        if (selectionIndex !== -1 && appState.selectedEvents[selectionIndex]) {
            return { isSelected: true, selectedOption: appState.selectedEvents[selectionIndex]!.selectedOption };
        }
        return { isSelected: false, selectedOption: null };
    };

    const handleEventSelectFromList = (event: Event) => {
        const targetIndex = appState.selectedEvents.findIndex((e: Event | null) => e === null);
        handleOpenDialog('event-selection', { event, isModification: false, modificationIndex: targetIndex });
    };

    const handleChannelClick = (channel: Channel) => {
        const targetIndex = appState.selectedEvents.findIndex((e: any) => e === null);
        if (targetIndex !== -1) {
            const event = {
                id: `${channel.name}-channel-static`,
                title: channel.name,
                options: channel.urls.map(u => ({ ...u, hd: false, language: '' })),
                sources: [], buttons: [], time: 'AHORA', category: 'Canal' as const,
                language: '', date: '', source: '', status: 'En Vivo' as const, image: channel.logo,
            };
            handleOpenDialog('event-selection', { event, isModification: false, modificationIndex: targetIndex });
        }
    };
    
    const handleModifyEvent = (event: Event, index: number) => {
        const currentEventState = appState.selectedEvents[index];
        if (!currentEventState) return;
        const eventForModification = { ...event, selectedOption: currentEventState.selectedOption };
        handleOpenDialog('event-selection', { event: eventForModification, isModification: true, modificationIndex: index });
    };

    const handleToggleFullscreen = (index: number) => {
        const currentFullscreen = appState.fullscreenIndex;
        handleUpdateState({ fullscreenIndex: currentFullscreen === index ? null : index });
    };
    
    const handleRemoveEventFromSelection = () => {
        if (modificationIndex !== null) {
            const newSelectedEvents = [...appState.selectedEvents];
            newSelectedEvents[modificationIndex] = null;
            handleUpdateState({ selectedEvents: newSelectedEvents });
            setIsEventSelectionOpen(false); // Close dialog on removal
        }
    };
    
    const handleFinalSelectEvent = (event: Event, option: string) => {
         const newSelectedEvents = [...appState.selectedEvents];
         if (modificationIndex !== null && modificationIndex >= 0) {
            newSelectedEvents[modificationIndex] = { ...event, selectedOption: option };
            handleUpdateState({ selectedEvents: newSelectedEvents });
         }
         setIsEventSelectionOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-background z-[100] flex flex-col">
                <LayoutConfigurator
                    order={appState.viewOrder.filter((i: number) => appState.selectedEvents[i] !== null)}
                    onOrderChange={(newOrder: number[]) => handleUpdateState({ viewOrder: newOrder })}
                    eventDetails={appState.selectedEvents}
                    onRemove={(indexToRemove: number) => {
                        const newSelectedEvents = [...appState.selectedEvents];
                        newSelectedEvents[indexToRemove] = null;
                        handleUpdateState({ selectedEvents: newSelectedEvents });
                    }}
                    onModify={handleModifyEvent}
                    isViewPage={true}
                    onAddEvent={() => setIsAddEventOpen(true)}
                    onSchedule={() => setIsScheduleOpen(true)}
                    onToggleFullscreen={handleToggleFullscreen}
                    fullscreenIndex={appState.fullscreenIndex}
                    gridGap={appState.gridGap}
                    onGridGapChange={(value: number) => handleUpdateState({ gridGap: value })}
                    borderColor={appState.borderColor}
                    onBorderColorChange={(value: string) => handleUpdateState({ borderColor: value })}
                    isChatEnabled={appState.isChatEnabled}
                    onIsChatEnabledChange={(value: boolean) => handleUpdateState({ isChatEnabled: value })}
                    categories={allCategories}
                    onRestoreGridSettings={() => handleUpdateState({ gridGap: 0, borderColor: '#000000' })}
                    onOpenTutorial={() => {}}
                    onOpenErrors={() => {}}
                    onOpenCalendar={() => {}}
                    isTutorialOpen={false}
                    onIsTutorialOpenChange={() => {}}
                    isErrorsOpen={false}
                    onIsErrorsOpenChange={() => {}}
                    onStopSession={onStop}
                    isRemoteControlView={true}
                />
            </div>

            <AddEventsDialog
                open={isAddEventOpen}
                onOpenChange={setIsAddEventOpen}
                events={allEvents || []}
                channels={allChannels || []}
                getEventSelection={getSelectionForDialog}
                onEventSelect={handleEventSelectFromList}
                onChannelClick={handleChannelClick}
            />
            
            <ScheduleManager
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
                currentSelection={futureSelection}
                currentOrder={futureOrder}
                schedules={appState.schedules}
                onSchedulesChange={(newSchedules) => handleUpdateState({ schedules: newSchedules })}
                onModifyEventInView={() => {}}
                onAddEvent={() => {
                    setIsScheduleOpen(false);
                    setIsAddEventOpen(true);
                }}
                initialSelection={appState.selectedEvents}
                initialOrder={appState.viewOrder}
                setFutureSelection={setFutureSelection}
                setFutureOrder={setFutureOrder}
                isLoading={false}
            />

            {dialogEvent && (
                <EventSelectionDialog
                    isOpen={isEventSelectionOpen}
                    onOpenChange={setIsEventSelectionOpen}
                    event={dialogEvent}
                    onSelect={handleFinalSelectEvent}
                    isModification={isModification}
                    onRemove={handleRemoveEventFromSelection}
                    isLoading={isLoading}
                />
            )}
        </>
    );
}
