import React, { useRef } from "react";
import {
  Palette,
  Building2,
  FileText,
  Upload,
  Trash2,
  Check,
  Type,
  Stethoscope,
  CreditCard,
  Phone,
  MapPin,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const COLOR_PRESETS = [
  { name: "FemeSalud Violeta", hex: "#992ACB" },
  { name: "Medizen Azul", hex: "#4361EE" },
  { name: "Teal Clínico", hex: "#0D9488" },
  { name: "Verde Salud", hex: "#059669" },
  { name: "Rosa Materno", hex: "#DB2777" },
  { name: "Azul Marino", hex: "#1E3A8A" },
  { name: "Gris Pizarra", hex: "#334155" },
];

export interface BrandTabProps {
  logoBase64: string;
  setLogoBase64: (val: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  primaryColor: string;
  setPrimaryColor: (val: string) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
}

export function BrandTabContent({
  logoBase64,
  setLogoBase64,
  onLogoUpload,
  primaryColor,
  setPrimaryColor,
  fontFamily,
  setFontFamily,
}: BrandTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Logo del Documento
          </Label>
          {logoBase64 && (
            <button
              type="button"
              onClick={() => setLogoBase64("")}
              className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Quitar logo
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={logoBase64 ? "Cambiar logo de la clínica" : "Subir logo de la clínica"}
          className={cn(
            "w-full relative h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group p-3 text-center",
            logoBase64
              ? "border-primary/40 bg-primary/5 hover:border-primary"
              : "border-border/60 hover:border-primary/60 hover:bg-muted/50",
          )}
        >
          {logoBase64 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={logoBase64}
                alt="Logo"
                className="max-h-full max-w-full object-contain drop-shadow-xs"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-md">
                  Cambiar Logo
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              <div className="p-2.5 rounded-full bg-muted group-hover:bg-primary/10">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Subir imagen del logo</span>
              <span className="text-[10px] text-muted-foreground">
                PNG transparente recomendado (Max 1.5MB)
              </span>
            </div>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/svg+xml, image/webp"
          onChange={onLogoUpload}
        />
      </div>

      <div className="space-y-3 pt-1 border-t border-border/30">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Color Corporativo de la Papelería
        </Label>

        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_PRESETS.map((p) => {
            const isSelected = primaryColor.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                title={p.name}
                onClick={() => setPrimaryColor(p.hex)}
                className={cn(
                  "w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-xs ring-offset-2",
                  isSelected
                    ? "scale-110 ring-2 ring-primary ring-offset-background"
                    : "hover:scale-105",
                )}
                style={{ backgroundColor: p.hex }}
              >
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-white drop-shadow-xs stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shadow-inner border border-border/60 overflow-hidden relative cursor-pointer ring-1 ring-border/50 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <input
              type="color"
              aria-label="Color corporativo principal"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="absolute inset-0 w-[200%] h-[200%] -top-2 -left-2 cursor-pointer opacity-0"
            />
          </div>
          <div className="relative flex-1">
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono text-sm uppercase rounded-xl bg-muted/40 border-border/50 h-10 text-foreground font-bold pl-3"
              maxLength={7}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Se aplica al nombre institucional, la línea divisoria del membrete y el monograma Rx.
        </p>
      </div>

      <div className="space-y-2 pt-1 border-t border-border/30">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" /> Tipografía Oficial
        </Label>
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-muted/40 border-border/50">
            <SelectValue placeholder="Selecciona una fuente" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="font-serif">
              <div className="flex flex-col text-left py-0.5">
                <span className="font-serif font-bold text-sm">
                  Clásica (Serif / Times)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Tradicional y formal — estándar médico
                </span>
              </div>
            </SelectItem>
            <SelectItem value="font-sans">
              <div className="flex flex-col text-left py-0.5">
                <span className="font-sans font-bold text-sm">
                  Moderna (Sans-serif / Inter)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Limpia, contemporánea y minimalista
                </span>
              </div>
            </SelectItem>
            <SelectItem value="font-mono">
              <div className="flex flex-col text-left py-0.5">
                <span className="font-mono font-bold text-sm">Técnica (Monospace)</span>
                <span className="text-[11px] text-muted-foreground">
                  Estilo reporte de laboratorio / mecanografía
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export interface ClinicTabProps {
  clinicName: string;
  setClinicName: (val: string) => void;
  clinicType: string;
  setClinicType: (val: string) => void;
  clinicRif: string;
  setClinicRif: (val: string) => void;
  clinicPhone: string;
  setClinicPhone: (val: string) => void;
  addressLine1: string;
  setAddressLine1: (val: string) => void;
  addressLine2: string;
  setAddressLine2: (val: string) => void;
}

export function ClinicTabContent({
  clinicName,
  setClinicName,
  clinicType,
  setClinicType,
  clinicRif,
  setClinicRif,
  clinicPhone,
  setClinicPhone,
  addressLine1,
  setAddressLine1,
  addressLine2,
  setAddressLine2,
}: ClinicTabProps) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in-50 duration-200">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" /> Nombre del Centro / Clínica
        </Label>
        <Input
          placeholder="Ej: FemeSalud"
          className="rounded-xl bg-muted/40 border-border/50 text-sm font-bold text-foreground h-10"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-primary" /> Especialidad o Tipo de Consultorio
        </Label>
        <Input
          placeholder="Ej: Consultorio Ginecológico Obstétrico"
          className="rounded-xl bg-muted/40 border-border/50 text-sm h-10"
          value={clinicType}
          onChange={(e) => setClinicType(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" /> RIF / Identificación
          </Label>
          <Input
            placeholder="Ej: J-502316876"
            className="rounded-xl bg-muted/40 border-border/50 text-sm h-10 uppercase"
            value={clinicRif}
            onChange={(e) => setClinicRif(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" /> Teléfonos
          </Label>
          <Input
            placeholder="Ej: 0412/8299890"
            className="rounded-xl bg-muted/40 border-border/50 text-sm h-10"
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Dirección Línea 1 (Calle / Edificio)
        </Label>
        <Input
          placeholder="Ej: Calle las Flores entre González Padrón y Shettino, N° 16"
          className="rounded-xl bg-muted/40 border-border/50 text-sm h-10"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Dirección Línea 2 (Ciudad / Estado)
        </Label>
        <Input
          placeholder="Ej: Valle de la Pascua, Estado Guárico"
          className="rounded-xl bg-muted/40 border-border/50 text-sm h-10"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
        />
      </div>
    </div>
  );
}

export interface TextsTabProps {
  headerText: string;
  setHeaderText: (val: string) => void;
  footerText: string;
  setFooterText: (val: string) => void;
}

export function TextsTabContent({
  headerText,
  setHeaderText,
  footerText,
  setFooterText,
}: TextsTabProps) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in-50 duration-200">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Lema / Subtítulo del Encabezado
        </Label>
        <Input
          placeholder="Ej: #Gente Que Suma"
          className="rounded-xl bg-muted/40 border-border/50 text-sm h-10"
          value={headerText}
          onChange={(e) => setHeaderText(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Se imprime centrado debajo del nombre de la clínica en estilo distintivo.
        </p>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border/30">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Pie de Página Institucional (Opcional)
        </Label>
        <Textarea
          placeholder="Ej: Válido sólo con firma y sello original • Prohibida su alteración"
          className="min-h-[70px] rounded-xl bg-muted/40 border-border/50 resize-none text-sm"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Texto legal o de seguridad que aparece centrado al final de la hoja.
        </p>
      </div>
    </div>
  );
}

export interface RecipeControlsPanelProps {
  activeTab: "brand" | "clinic" | "texts";
  setActiveTab: (tab: "brand" | "clinic" | "texts") => void;
  logoBase64: string;
  setLogoBase64: (val: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  primaryColor: string;
  setPrimaryColor: (val: string) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  clinicName: string;
  setClinicName: (val: string) => void;
  clinicType: string;
  setClinicType: (val: string) => void;
  clinicRif: string;
  setClinicRif: (val: string) => void;
  clinicPhone: string;
  setClinicPhone: (val: string) => void;
  addressLine1: string;
  setAddressLine1: (val: string) => void;
  addressLine2: string;
  setAddressLine2: (val: string) => void;
  headerText: string;
  setHeaderText: (val: string) => void;
  footerText: string;
  setFooterText: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function RecipeControlsPanel(props: RecipeControlsPanelProps) {
  const {
    activeTab,
    setActiveTab,
    logoBase64,
    setLogoBase64,
    onLogoUpload,
    primaryColor,
    setPrimaryColor,
    fontFamily,
    setFontFamily,
    clinicName,
    setClinicName,
    clinicType,
    setClinicType,
    clinicRif,
    setClinicRif,
    clinicPhone,
    setClinicPhone,
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    headerText,
    setHeaderText,
    footerText,
    setFooterText,
    onSave,
    isSaving,
  } = props;

  const tabs = [
    { id: "brand" as const, label: "Marca", icon: Palette },
    { id: "clinic" as const, label: "Clínica", icon: Building2 },
    { id: "texts" as const, label: "Textos", icon: FileText },
  ];

  return (
    <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0 space-y-4">
      <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5",
                isActive
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "brand" && (
        <BrandTabContent
          logoBase64={logoBase64}
          setLogoBase64={setLogoBase64}
          onLogoUpload={onLogoUpload}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
        />
      )}

      {activeTab === "clinic" && (
        <ClinicTabContent
          clinicName={clinicName}
          setClinicName={setClinicName}
          clinicType={clinicType}
          setClinicType={setClinicType}
          clinicRif={clinicRif}
          setClinicRif={setClinicRif}
          clinicPhone={clinicPhone}
          setClinicPhone={setClinicPhone}
          addressLine1={addressLine1}
          setAddressLine1={setAddressLine1}
          addressLine2={addressLine2}
          setAddressLine2={setAddressLine2}
        />
      )}

      {activeTab === "texts" && (
        <TextsTabContent
          headerText={headerText}
          setHeaderText={setHeaderText}
          footerText={footerText}
          setFooterText={setFooterText}
        />
      )}

      <Button
        onClick={onSave}
        disabled={isSaving}
        className="w-full rounded-xl py-6 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        Guardar Configuración
      </Button>
    </div>
  );
}
