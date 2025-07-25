import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/icons';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="text-primary animate-bounce">
            <SparklesIcon size={48} />
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-primary drop-shadow-lg">
            404
          </h1>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
          Page Not Found
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-md">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved.
          <br />
          Let&apos;s get you back to something awesome.
        </p>
        <Link href="/">
          <Button size="lg" className="mt-2 shadow-lg">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
