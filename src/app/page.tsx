import { EntryForm } from '@/components/entry-form';
import { Train } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-fit rounded-lg bg-primary p-3 text-primary-foreground">
            <Train className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            RailTalk
          </h1>
          <p className="mt-4 text-muted-foreground">
            Hop on board and connect with fellow passengers on your train journey.
          </p>
        </div>
        <EntryForm />
        <p className="text-center text-xs text-muted-foreground">
          Your chat room is temporary and anonymous. Data will be cleared after the journey ends.
        </p>
      </div>
    </main>
  );
}
