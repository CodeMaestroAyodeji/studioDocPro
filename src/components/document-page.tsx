import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DocumentPageProps = {
  children: ReactNode;
  className?: string;
};

export function DocumentPage({ children, className }: DocumentPageProps) {
  return (
    <div
      className={cn(
        'printable-area bg-card text-card-foreground shadow-lg rounded-lg p-8 md:p-12',
        className
      )}
    >
      {children}
    </div>
  );
}
