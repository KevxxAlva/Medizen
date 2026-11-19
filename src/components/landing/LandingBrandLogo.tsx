import { Link } from "@tanstack/react-router";
import { MedizenLogo } from "@/components/MedizenLogo";

export function LandingBrandLogo({
  subtitle = "Suite Clínica Inteligente",
}: {
  subtitle?: string;
}) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <MedizenLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
      <div className="flex flex-col">
        <span className="font-display font-bold text-lg leading-none tracking-normal text-foreground">
          Medi<span className="text-primary">zen</span>
        </span>
        <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

