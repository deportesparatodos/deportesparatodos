"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Tv } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const handleNumCamerasChange = (value: string) => {
    setNumCameras(parseInt(value, 10));
    setErrorMessage(""); // Clear error on change
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = value;
    setCameraUrls(newUrls);
    if (value.trim() !== "") {
       setErrorMessage(""); // Clear error if user starts typing
    }
  };

  const cameraOptions = [1, 2, 3, 4];

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Configurar Vistas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium text-foreground mb-2 block">Cantidad de Cámaras:</Label>
          <Select value={numCameras.toString()} onValueChange={handleNumCamerasChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Seleccionar cantidad" />
            </SelectTrigger>
            <SelectContent>
              {cameraOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {Array.from({ length: numCameras }).map((_, index) => (
            <div key={index}>
              <Label htmlFor={`url-${index}`} className="text-base font-medium text-foreground">
                URL del Stream para Vista {index + 1}:
              </Label>
              <Input
                id={`url-${index}`}
                type="url"
                placeholder="https://example.com/stream.m3u8"
                value={cameraUrls[index] || ''}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                className="mt-1 bg-background"
              />
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="flex items-center p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/30">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{errorMessage}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end items-center pt-6">
        <Button onClick={handleStartView} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Tv className="mr-2 h-4 w-4" /> Iniciar Vista
        </Button>
      </CardFooter>
    </Card>
  );
};
