import Image from 'next/image';

export function WelcomeMessage() {
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center">
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
