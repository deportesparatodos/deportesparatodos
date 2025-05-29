"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Tv } from 'lucide-react';
import Link from 'next/link';

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
        <CardTitle className="text-xl font-semibold text-primary">Configure Views</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium text-foreground mb-2 block">Number of Views:</Label>
          <RadioGroup
            value={numCameras.toString()}
            onValueChange={handleNumCamerasChange}
            className="flex space-x-4"
          >
            {cameraOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option.toString()} id={`views-${option}`} />
                <Label htmlFor={`views-${option}`} className="text-foreground">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          {Array.from({ length: numCameras }).map((_, index) => (
            <div key={index}>
              <Label htmlFor={`url-${index}`} className="text-base font-medium text-foreground">
                Stream URL for View {index + 1}:
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
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
        <Link href="/events" passHref legacyBehavior>
            <Button variant="outline" className="w-full sm:w-auto">
              <List className="mr-2 h-4 w-4" /> Event List
            </Button>
        </Link>
        <Button onClick={handleStartView} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Tv className="mr-2 h-4 w-4" /> Start View
        </Button>
      </CardFooter>
    </Card>
  );
};

// Stub for List icon if not available or to avoid lucide-react dependency if minimal
const List = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

