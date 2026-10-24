import React from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Edit2 } from "lucide-react";

export interface DashboardProfileCardProps {
  displayName: string;
  profile: any;
  roleDisplay: string;
  clinic: any;
}

export function DashboardProfileCard({
  displayName,
  profile,
  roleDisplay,
  clinic,
}: DashboardProfileCardProps) {
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "DR";

  return (
    <div className="glass-card rounded-[2rem] overflow-hidden shadow-lg shadow-black/5 relative pt-16">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary to-primary/90 px-6 py-4 flex justify-between items-start text-primary-foreground border-b border-primary/20">
        <span className="text-xs font-bold tracking-widest uppercase">Mi Perfil</span>
        <Link
          to="/configuracion"
          className="bg-black/10 p-1.5 rounded-lg hover:bg-black/20 transition"
        >
          <Edit2 className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-6 pb-6 relative">
        <div className="h-20 w-20 bg-card border-4 border-card rounded-2xl mx-auto -mt-10 mb-3 overflow-hidden flex items-center justify-center relative z-10 shadow-md">
          <div className="h-full w-full bg-primary/10 text-primary font-display font-bold text-2xl flex items-center justify-center">
            {initials}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-display font-bold text-foreground">{displayName}</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {profile?.specialty || roleDisplay}
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-primary font-bold">
            <MapPin className="h-3 w-3" /> {clinic?.name || "Clínica"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-border/40">
          <div>
            <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">
              Status
            </p>
            <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400">Activo</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">
              MPPS
            </p>
            <p className="text-xs font-bold text-foreground font-mono">{profile?.mpps || "N/A"}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">
              Rol
            </p>
            <p className="text-xs font-bold text-foreground capitalize">{roleDisplay}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
