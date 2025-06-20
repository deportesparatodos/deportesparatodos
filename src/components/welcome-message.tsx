import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WelcomeMessageProps {
  areUrlsComplete: boolean;
}

export function WelcomeMessage({ areUrlsComplete }: WelcomeMessageProps) {
  return (
    <Card className="mb-6 shadow-lg overflow-hidden">
      <div className={cn(
        "h-2 w-full",
        areUrlsComplete ? "bg-green-500" : "bg-red-500"
      )} />
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center uppercase text-primary">
          DEPORTES PARA TODOS
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-2">
          Pega los enlaces de las transmisiones que quieres ver a continuación. Configura la cantidad de vistas y ¡a disfrutar!
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
