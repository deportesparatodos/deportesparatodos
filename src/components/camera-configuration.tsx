
"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { useState } from 'react'; // Importar useState
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Tv, ArrowUp, ArrowDown, X, ClipboardPaste } from 'lucide-react';
import { cn } from "@/lib/utils"; // Importar cn

interface CameraConfigurationProps {
  numCameras: number;
  setNumCameras: Dispatch<SetStateAction<number>>;
  cameraUrls: string[];
  setCameraUrls: Dispatch<SetStateAction<string[]>>;
  errorMessage: string;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  handleStartView: () => void;
}

export const CameraConfigurationComponent: FC<CameraConfigurationProps> = ({
  numCameras,
  setNumCameras,
  cameraUrls,
  setCameraUrls,
  errorMessage,
  setErrorMessage,
  handleStartView,
}) => {
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [hoveredInputIndex, setHoveredInputIndex] = useState<number | null>(null);

  const handleNumCamerasChange = (value: number) => {
    setNumCameras(value);
    setErrorMessage("");
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = value;
    setCameraUrls(newUrls);
    if (value.trim() !== "") {
       setErrorMessage("");
    }
  };

  const handleClearUrl = (index: number) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = '';
    setCameraUrls(newUrls);
    setErrorMessage("");
  };

  const handleMoveUrl = (index: number, direction: 'up' | 'down') => {
    const newUrls = [...cameraUrls];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= numCameras) {
      return;
    }

    for (let i = 0; i < numCameras; i++) {
        if (newUrls[i] === undefined) newUrls[i] = '';
    }

    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    setCameraUrls(newUrls);
    setErrorMessage("");
  };

  const handlePasteUrl = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const newUrls = [...cameraUrls];
        newUrls[index] = text;
        setCameraUrls(newUrls);
        setErrorMessage(""); 
      }
    } catch (err) {
      console.error("Error al pegar desde el portapapeles: ", err);
      setErrorMessage("No se pudo pegar. Verifica los permisos del portapapeles.");
    }
  };

  const viewOptions = [
    { value: 1, display: "1" },
    { value: 2, display: "2" },
    { value: 3, display: "3" },
    { value: 4, display: "4" },
  ];

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleStartView();
  };

  return (
    <Card className="mb-6 shadow-lg w-full h-full flex flex-col">
      <form onSubmit={handleFormSubmit}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Configuración de Vistas:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex-grow">
          <div>
            <Label className="text-base font-medium text-foreground mb-2 block">Cantidad de Ventanas:</Label>
            <div className="flex space-x-2 mt-2">
              {viewOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={numCameras === option.value ? "default" : "outline"}
                  onClick={() => handleNumCamerasChange(option.value)}
                  className="h-12 w-12 text-lg"
                  aria-label={`Seleccionar ${option.display} ventana${option.value > 1 ? 's' : ''}`}
                  type="button"
                >
                  {option.display}
                </Button>
              ))}
            </div>
          </div>

          <div>
              <Label className="text-base font-medium text-foreground mb-2 block pt-4">
                  URLs de las Vistas:
              </Label>
              <div className="space-y-3">
              {Array.from({ length: numCameras }).map((_, index) => {
                const hasUrl = cameraUrls[index] && cameraUrls[index].trim() !== '';
                const isFocused = focusedInput === index;
                const isHovered = hoveredInputIndex === index;
                const isActive = isFocused || isHovered;

                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveUrl(index, 'up')}
                        disabled={index === 0}
                        aria-label="Mover URL hacia arriba"
                        className="bg-background hover:bg-accent/50"
                        type="button" 
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    
                    <div // Contenedor para la lógica de hover y posicionamiento
                      className="relative flex-grow"
                      onMouseEnter={() => {
                        setHoveredInputIndex(index);
                        if (errorMessage && !cameraUrls[index] && !isFocused) { // Limpiar error si se hace hover sobre campo vacío y no está enfocado
                            setErrorMessage('');
                        }
                      }}
                      onMouseLeave={() => setHoveredInputIndex(null)}
                    >
                      <Input
                        id={`url-${index}`}
                        type="url"
                        placeholder={isActive && !hasUrl ? `URL Vista ${index + 1}` : ""}
                        value={cameraUrls[index] || ''}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        onFocus={() => {
                          setFocusedInput(index);
                          if (errorMessage && !cameraUrls[index]) { // Limpiar error si se enfoca un campo vacío
                              setErrorMessage('');
                          }
                        }}
                        onBlur={() => setFocusedInput(null)}
                        className={cn(
                          "w-full",
                          // Estilos de fondo y borde siempre aplicados basados en hasUrl
                          hasUrl
                            ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 focus:ring-green-500 dark:focus:ring-green-600"
                            : "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-600",
                          // Estilos de texto y placeholder basados en isActive Y hasUrl
                          isActive
                            ? (hasUrl 
                                ? "text-green-800 dark:text-green-300" 
                                : "text-red-800 dark:text-red-300 placeholder-red-500 dark:placeholder-red-400/80"
                              ) 
                            : "text-transparent placeholder-transparent selection:text-transparent selection:bg-transparent caret-transparent" // Ocultar todo si no está activo
                        )}
                        readOnly={!isActive && hasUrl}
                      />
                      {!isActive && (
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center px-3 py-2 text-sm rounded-md pointer-events-none select-none",
                            hasUrl
                              ? "bg-green-600 text-white" // Usar un verde más oscuro para el overlay
                              : "bg-destructive text-destructive-foreground" // Usar colores de destructive para el overlay rojo
                          )}
                        >
                          {hasUrl ? "Enlace Pegado" : "Enlace sin Copiar"}
                        </div>
                      )}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePasteUrl(index)}
                        aria-label="Pegar URL desde portapapeles"
                        className="bg-background hover:bg-accent/50"
                        type="button"
                    >
                        <ClipboardPaste className="h-4 w-4" />
                    </Button>
                    {cameraUrls[index] && ( // Mostrar botón X solo si hay URL, independientemente de si está activo o no
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleClearUrl(index)}
                          aria-label="Limpiar URL"
                          className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          type="button"
                      >
                          <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveUrl(index, 'down')}
                        disabled={index === numCameras - 1}
                        aria-label="Mover URL hacia abajo"
                        className="bg-background hover:bg-accent/50"
                        type="button"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
              </div>
          </div>

          {errorMessage && (
            <div className="flex items-center p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/30">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{errorMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end items-center pt-6">
          <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Tv className="mr-2 h-4 w-4" /> Iniciar Vista
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

