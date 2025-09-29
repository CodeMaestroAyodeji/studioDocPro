import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <h1 className="text-xl font-semibold font-headline">{title}</h1>
    </header>
  );
}
