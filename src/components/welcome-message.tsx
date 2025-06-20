import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function WelcomeMessage() {
  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center uppercase bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.red.500),theme(colors.orange.500),theme(colors.yellow.500),theme(colors.green.500),theme(colors.blue.500),theme(colors.indigo.500),theme(colors.violet.500)))]">
          DEPORTES PARA TODOS
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-2">
          Pega los enlaces de las transmisiones que quieres ver a continuación. Configura la cantidad de vistas y ¡a disfrutar!
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
