import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function WelcomeMessage() {
  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">MultiViewer for Sport</CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-2">
          Paste the links of the streams you want to watch below. Configure the number of views and enjoy!
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
