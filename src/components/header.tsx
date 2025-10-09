import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function Header({ title, description, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-auto items-center gap-4 border-b bg-background px-4 py-2 sm:static sm:border-0 sm:bg-transparent sm:px-6",
        className
      )}
    >
      <SidebarTrigger className="sm:hidden" />
      <div>
        <h1 className="text-xl font-semibold font-headline">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
