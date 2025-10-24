import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Define a type for the color prop
type CardColor = 
  | 'green' | 'red' | 'blue' | 'emerald' 
  | 'yellow' | 'orange' | 'indigo' | 'cyan' | 'violet';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon?: LucideIcon;
  color?: CardColor; // ✅ CHANGED: from iconColor: string to color: CardColor
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color // ✅ Use the new 'color' prop
}: StatsCardProps) {

  // ✅ ADDED: Map color names to actual Tailwind classes
  const colorClasses = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/50",
    red: "text-red-600 bg-red-100 dark:bg-red-900/50",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    yellow: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/50",
    indigo: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50",
    cyan: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/50",
    violet: "text-violet-600 bg-violet-100 dark:bg-violet-900/50",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              // ✅ CHANGED: Use the color map
              color ? colorClasses[color] : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

