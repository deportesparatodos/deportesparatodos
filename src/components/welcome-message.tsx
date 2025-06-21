import Image from 'next/image';
import { cn } from "@/lib/utils";

interface WelcomeMessageProps {
  areUrlsComplete: boolean;
}

export function WelcomeMessage({ areUrlsComplete }: WelcomeMessageProps) {
  return (
    <div className="w-full max-w-md">
      <div className={cn(
        "h-2 w-full",
        areUrlsComplete ? "bg-green-500" : "bg-red-500"
      )} />
      <div className="my-4 flex justify-center">
        <Image
          src="https://i.ibb.co/BVLhxp2k/deportes-para-todos.png"
          alt="Deportes Para Todos Logo"
          width={400}
          height={100}
          data-ai-hint="logo"
          priority
        />
      </div>
    </div>
  );
}
