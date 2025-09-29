import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  className?: string;
};

export function Header({ title, className }: HeaderProps) {
  return (
    <header className={cn("sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6", className)}>
      <SidebarTrigger className="sm:hidden" />
      <h1 className="text-xl font-semibold font-headline">{title}</h1>
    </header>
  );
}
