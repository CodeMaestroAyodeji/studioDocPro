import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VendorLogoProps {
  logoUrl?: string | null;
  companyName: string;
}

export function VendorLogo({ logoUrl, companyName }: VendorLogoProps) {
  const fallbackText = companyName ? companyName.charAt(0).toUpperCase() : "";

  return (
    <Avatar>
      <AvatarImage src={logoUrl || undefined} alt={companyName} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  );
}
