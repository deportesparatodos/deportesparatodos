import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function WelcomeMessage() {
  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center uppercase">
          <span className="text-red-500">DE</span>
          <span className="text-orange-500">PO</span>
          <span className="text-yellow-500">RT</span>
          <span className="text-green-500">ES</span>
          <span> </span>
          <span className="text-blue-500">PA</span>
          <span className="text-purple-500">RA</span>
          <span> </span>
          <span className="text-red-500">TO</span>
          <span className="text-orange-500">DOS</span>
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-2">
          Pega los enlaces de las transmisiones que quieres ver a continuación. Configura la cantidad de vistas y ¡a disfrutar!
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
