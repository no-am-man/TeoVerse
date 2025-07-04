import { AuthButton } from '@/components/auth-button';
import { Logo } from '@/components/logo';
import { Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="absolute top-0 left-0 p-4 sm:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            A New Financial Order
          </h1>
          <p className="mt-4 text-lg text-foreground/80">
            Mint your sovereign identity, tokenize your assets, and trade freely in a decentralized ecosystem built on Bitcoin.
          </p>
          <div className="mt-8">
            <AuthButton />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your Gmail is the sole unique identifier, enabling cross-federation interactions.
          </p>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <a
          href="https://github.com/no-am-man/TeoVerse"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span>TeoVerse is an open-source project.</span>
        </a>
      </footer>
    </div>
  );
}
