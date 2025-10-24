import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Define a type for the color prop
type CardColor =
  | "green"
  | "red"
  | "blue"
  | "emerald"
  | "yellow"
  | "orange"
  | "indigo"
  | "cyan"
  | "violet";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon?: LucideIcon;
  color?: CardColor;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: StatsCardProps) {
  const colorClasses = {
    green: {
      bg: "from-green-500 to-emerald-500",
      shadow: "shadow-green-500/40",
      text: "text-white",
    },
    red: {
      bg: "from-red-500 to-rose-500",
      shadow: "shadow-red-500/40",
      text: "text-white",
    },
    blue: {
      bg: "from-blue-500 to-sky-500",
      shadow: "shadow-blue-500/40",
      text: "text-white",
    },
    emerald: {
      bg: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/40",
      text: "text-white",
    },
    yellow: {
      bg: "from-yellow-500 to-amber-500",
      shadow: "shadow-yellow-500/40",
      text: "text-white",
    },
    orange: {
      bg: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/40",
      text: "text-white",
    },
    indigo: {
      bg: "from-indigo-500 to-violet-500",
      shadow: "shadow-indigo-500/40",
      text: "text-white",
    },
    cyan: {
      bg: "from-cyan-500 to-sky-500",
      shadow: "shadow-cyan-500/40",
      text: "text-white",
    },
    violet: {
      bg: "from-violet-500 to-purple-500",
      shadow: "shadow-violet-500/40",
      text: "text-white",
    },
  };

  const selectedColor = color ? colorClasses[color] : undefined;

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-none transition-transform duration-300 ease-in-out hover:scale-105",
        selectedColor
          ? `bg-gradient-to-br ${selectedColor.bg} ${selectedColor.shadow} shadow-lg`
          : "bg-card"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/10 backdrop-blur-sm",
          !selectedColor && "hidden"
        )}
      />
      <div className="relative z-10">
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            selectedColor && selectedColor.text
          )}
        >
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </CardHeader>
        <CardContent className={cn(selectedColor && selectedColor.text)}>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs opacity-80">{description}</p>
        </CardContent>
      </div>
    </Card>
  );
}

