import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  Settings, User as UserIcon, Building, Save, Loader2, Shield, Search, ClipboardList, 
  FileText, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Trash2, Check, Palette, LogOut 
} from "lucide-react";
import { COLOR_THEMES, type ColorTheme, updateFaviconColor } from "@/components/ThemeCustomizer";
import { useAuthSession, useIsAdmin, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile } from "@/lib/api/profiles";
import { useAuditLogs } from "@/lib/api/audit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RecipeDesigner } from "@/components/settings/RecipeDesigner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import {
  removeQuickAccessAccount,
  saveQuickAccessAccount,
  saveUserPinHash,
  removeUserPinHash,
  hasUserPinConfigured,
  verifyUserPin,
} from "@/lib/auth/quickAccess";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Medizen" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { user } = useAuthSession();
  const { data: profile, isLoading: loadingProfile } = useMyProfile(user?.id);
  const { data: roles = [] } = useRoles();
  const isAdmin = useIsAdmin();

  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className={cn(
      "space-y-6 mx-auto py-2 font-sans text-foreground transition-[max-width,padding] duration-300",
      activeTab === "recipe" ? "max-w-7xl px-2 sm:px-4" : "max-w-4xl"
    )}>
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustes Generales</p>
        <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 animate-spin-slow" /> Configuración
        </h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 p-1 rounded-2xl mb-6 max-w-2xl h-auto flex-wrap">
          <TabsTrigger value="profile" className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
          >
            <Lock className="h-4 w-4" /> Seguridad
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            disabled={!isAdmin && !loadingProfile}
          >
            <ClipboardList className="h-4 w-4" /> Auditoría
          </TabsTrigger>
          <TabsTrigger
            value="recipe"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            disabled={!isAdmin && !loadingProfile}
          >
            <FileText className="h-4 w-4" /> Recetario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="outline-none space-y-4">
          <UserProfileSection profile={profile} loadingProfile={loadingProfile} roles={roles} user={user} />
          <AccentThemeSection />
        </TabsContent>

        <TabsContent value="security" className="outline-none space-y-4">
          <SecuritySection />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="audit" className="outline-none space-y-4">
            <AuditLogSection />
          </TabsContent>
        )}
      
        {isAdmin && (
          <TabsContent value="recipe" className="outline-none space-y-4">
            <RecipeDesigner />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function UserProfileSection({
  profile,
  loadingProfile,
  roles,
  user,
}: {
  profile: any;
  loadingProfile: boolean;
  roles: string[];
  user: any;
}) {
  const updateProfile = useUpdateProfile();
  const router = useRouter();
  const qc = useQueryClient();
  const [profileName, setProfileName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileUniversity, setProfileUniversity] = useState("");
  const [profileMpps, setProfileMpps] = useState("");
  const [profileCmc, setProfileCmc] = useState("");

  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfileSpecialty(profile.specialty || "");
      setProfileUniversity(profile.university || "");
      setProfileMpps(profile.mpps || "");
      setProfileCmc(profile.cmc || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        fullName: profileName.trim(),
        specialty: profileSpecialty.trim() || null,
        university: profileUniversity.trim() || null,
        mpps: profileMpps.trim() || null,
        cmc: profileCmc.trim() || null,
      });
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar perfil");
    }
  };

  const initials = (name: string) => {
    return (name || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const isProfileLoading = loadingProfile || updateProfile.isPending;

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
      
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-border/40">
          <div className="h-20 w-20 rounded-[1.25rem] bg-muted/50 text-primary flex items-center justify-center font-black text-2xl shadow-sm border border-border/40">
            {initials(profileName || user?.email || "")}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-lg text-foreground">{profileName || "Usuario FemeSalud"}</h3>
            <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
              {roles.map((r) => {
                const isRAdmin = r.toLowerCase().startsWith("admin");
                const isRRecep = r.toLowerCase().startsWith("recep");
                return (
                  <span
                    key={r}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1",
                      isRAdmin
                        ? "bg-purple-50 text-purple-600 border border-purple-100"
                        : isRRecep
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    {isRAdmin ? "Administrador" : isRRecep ? "Recepcionista" : "Médico"}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nombre Completo
            </Label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              disabled={isProfileLoading}
              placeholder="Ej. Dra. Carli Solé Aquino"
              className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-specialty" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Especialidad / Cargo
            </Label>
            <Input
              id="profile-specialty"
              value={profileSpecialty}
              onChange={(e) => setProfileSpecialty(e.target.value)}
              disabled={isProfileLoading}
              placeholder="Ej. Ginecología y Obstetricia"
              className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-university" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Universidad / Colegio
            </Label>
            <Input
              id="profile-university"
              value={profileUniversity}
              onChange={(e) => setProfileUniversity(e.target.value)}
              disabled={isProfileLoading}
              placeholder="Ej. UC-CHET"
              className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-mpps" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                MPPS
              </Label>
              <Input
                id="profile-mpps"
                value={profileMpps}
                onChange={(e) => setProfileMpps(e.target.value)}
                disabled={isProfileLoading}
                placeholder="Ej. 102.927"
                className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-cmc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                CMC
              </Label>
              <Input
                id="profile-cmc"
                value={profileCmc}
                onChange={(e) => setProfileCmc(e.target.value)}
                disabled={isProfileLoading}
                placeholder="Ej. 11.619"
                className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              router.navigate({ to: "/auth", replace: true });
            }}
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 h-11 px-4 flex items-center gap-2 font-bold text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>

          <Button
            type="submit"
            disabled={isProfileLoading}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm h-11 px-6 flex items-center gap-2 font-bold text-sm"
          >
            {isProfileLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Perfil
          </Button>
        </div>
      </form>
    </div>
  );
}

function AccentThemeSection() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medizen-accent-color") || "blue";
    }
    return "blue";
  });

  const handleSelectAccentTheme = (theme: ColorTheme) => {
    setSelectedThemeId(theme.id);
    localStorage.setItem("medizen-accent-color", theme.id);
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--sidebar-primary", theme.primary);
    document.documentElement.style.setProperty("--ring", theme.ring);
    document.documentElement.style.setProperty("--sidebar-ring", theme.ring);
    updateFaviconColor(theme.primary);
    window.dispatchEvent(new CustomEvent("medizen-theme-changed", { detail: theme }));
    toast.success(`Color de acento cambiado a ${theme.name}`);
  };

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-border/40 mb-6">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">Color de Acento del Sistema</h3>
          <p className="text-xs text-muted-foreground">Personaliza el color de botones, gráficos, logotipos e iconos de la plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {COLOR_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelectAccentTheme(theme)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-2xl border transition-colors text-left cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/40 bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-5 w-5 rounded-full border border-black/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: theme.primary }}
                />
                <span className="text-xs font-bold text-foreground">{theme.name}</span>
              </div>
              {isSelected && (
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AuditLogSection() {
  const { data: logs = [], isLoading } = useAuditLogs(100);

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm">
      <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Registro de Actividades
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Este es el registro de auditoría de las acciones críticas (como eliminaciones) realizadas por los usuarios.
      </p>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No hay registros de auditoría disponibles.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString(APP_LOCALE, { timeZone: APP_TIME_ZONE })}
                  </td>
                  <td className="p-3 font-medium text-foreground">
                    {log.user_email || log.user_id.slice(0, 8)}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      log.action === "DELETE" ? "bg-red-500/10 text-red-500" :
                      log.action === "INSERT" ? "bg-green-500/10 text-green-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">
                    {log.entity_name}
                  </td>
                  <td className="p-3 text-xs max-w-xs truncate text-muted-foreground font-mono">
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SecuritySection() {
  const { user } = useAuthSession();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [savedPin, setSavedPin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [testPin, setTestPin] = useState("");
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchExistingPin = async () => {
      if (!user?.id) return;

      if (hasUserPinConfigured(user.id)) {
        setSavedPin(true);
        return;
      }

      const metaPin = user?.user_metadata?.security_pin;
      if (metaPin && String(metaPin).length === 4) {
        await saveUserPinHash(user.id, String(metaPin));
        if (!cancelled) setSavedPin(true);
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select("pin_seguridad")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data?.pin_seguridad && String(data.pin_seguridad).length === 4) {
        await saveUserPinHash(user.id, String(data.pin_seguridad));
        if (!cancelled) setSavedPin(true);
      }
    };

    void fetchExistingPin();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("La clave debe tener exactamente 4 dígitos numéricos.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Las claves ingresadas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { security_pin: pin },
      });

      if (user?.id) {
        await supabase
          .from("usuarios")
          .update({ pin_seguridad: pin })
          .eq("auth_id", user.id);

        await saveUserPinHash(user.id, pin);

        try {
          await saveQuickAccessAccount({
            userId: user.id,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
            pin,
          });
        } catch {
          // vault will register on next login
        }
      }

      setSavedPin(true);
      setPin("");
      setConfirmPin("");
      setIsEditing(false);
      setTestPin("");
      setTestResult(null);
      toast.success("¡Clave de 4 dígitos guardada con éxito!");
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar la clave");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar tu clave de seguridad de 4 dígitos?")) return;

    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { security_pin: null },
      });

      if (user?.id) {
        await supabase
          .from("usuarios")
          .update({ pin_seguridad: null })
          .eq("auth_id", user.id);

        removeUserPinHash(user.id);
        removeQuickAccessAccount(user.id);
      }

      setSavedPin(false);
      setPin("");
      setConfirmPin("");
      setIsEditing(false);
      setTestPin("");
      setTestResult(null);
      toast.success("Clave de seguridad eliminada.");
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar la clave");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPinChange = async (val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    setTestPin(cleanVal);
    if (cleanVal.length === 4 && user?.id) {
      const isValid = await verifyUserPin(user.id, cleanVal);
      if (isValid) {
        setTestResult("success");
        toast.success("¡Clave correcta! ✅");
      } else {
        setTestResult("error");
        toast.error("Clave incorrecta ❌");
      }
    } else {
      setTestResult(null);
    }
  };

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/40 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Clave de Seguridad</h2>
            <p className="text-xs text-muted-foreground">Protección con PIN numérico de 4 dígitos</p>
          </div>
        </div>

        {savedPin ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> Clave Activa
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" /> Sin Configurar
          </span>
        )}
      </div>

      {savedPin && !isEditing ? (
        <PinStatusView
          testPin={testPin}
          testResult={testResult}
          loading={loading}
          onTestPinChange={handleTestPinChange}
          onEdit={() => setIsEditing(true)}
          onRemove={handleRemovePin}
        />
      ) : (
        <PinForm
          pin={pin}
          confirmPin={confirmPin}
          showPin={showPin}
          loading={loading}
          isEditing={isEditing}
          onPinChange={setPin}
          onConfirmPinChange={setConfirmPin}
          onToggleShowPin={() => setShowPin(!showPin)}
          onSubmit={handleSavePin}
          onCancel={() => {
            setIsEditing(false);
            setPin("");
            setConfirmPin("");
          }}
        />
      )}
    </div>
  );
}

function PinStatusView({
  testPin,
  testResult,
  loading,
  onTestPinChange,
  onEdit,
  onRemove,
}: {
  testPin: string;
  testResult: "success" | "error" | null;
  loading: boolean;
  onTestPinChange: (val: string) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-muted/40 p-5 rounded-2xl border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Clave de 4 dígitos establecida
          </p>
          <p className="text-xs text-muted-foreground">
            Tu cuenta está protegida. Puedes cambiar tu clave o probar que funcione correctamente en cualquier momento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-xl font-bold text-xs"
          >
            Cambiar Clave
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={loading}
            className="text-destructive hover:bg-destructive/10 rounded-xl font-bold text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      <div className="bg-card p-5 rounded-2xl border border-border/40 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Probar mi clave de seguridad
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <InputOTP
            maxLength={4}
            value={testPin}
            onChange={onTestPinChange}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-11 h-12 text-lg font-bold" />
              <InputOTPSlot index={1} className="w-11 h-12 text-lg font-bold" />
              <InputOTPSlot index={2} className="w-11 h-12 text-lg font-bold" />
              <InputOTPSlot index={3} className="w-11 h-12 text-lg font-bold" />
            </InputOTPGroup>
          </InputOTP>

          {testResult === "success" && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="h-4 w-4" /> ¡Clave correcta!
            </span>
          )}
          {testResult === "error" && (
            <span className="text-xs font-bold text-destructive">
              Clave incorrecta
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ingresa tus 4 dígitos aquí para confirmar que los recuerdas.
        </p>
      </div>
    </div>
  );
}

function PinForm({
  pin,
  confirmPin,
  showPin,
  loading,
  isEditing,
  onPinChange,
  onConfirmPinChange,
  onToggleShowPin,
  onSubmit,
  onCancel,
}: {
  pin: string;
  confirmPin: string;
  showPin: boolean;
  loading: boolean;
  isEditing: boolean;
  onPinChange: (val: string) => void;
  onConfirmPinChange: (val: string) => void;
  onToggleShowPin: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Nueva Clave de 4 Dígitos</span>
            <button
              type="button"
              onClick={onToggleShowPin}
              className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 font-semibold"
            >
              {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPin ? "Ocultar" : "Mostrar"}
            </button>
          </Label>
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(val) => onPinChange(val.replace(/\D/g, ""))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-[11px] text-muted-foreground">
            Ingresa exactamente 4 números (ej. 1234).
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Confirmar Clave de 4 Dígitos
          </Label>
          <InputOTP
            maxLength={4}
            value={confirmPin}
            onChange={(val) => onConfirmPinChange(val.replace(/\D/g, ""))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
              <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
          className="rounded-xl bg-primary text-primary-foreground font-bold px-6 h-11"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar Clave de 4 Dígitos
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl font-bold text-xs"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
