import { useState, useRef, useEffect } from "react";
import { useClinicInfo, useUpdateClinicInfo } from "@/lib/api/clinic";
import { useAuthSession } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Upload, Loader2, Save, Eye, Palette, Building2, Type, FileText, 
  Check, Download, Sparkles, MapPin, Phone, CreditCard, Stethoscope,
  ZoomIn, ZoomOut, RotateCcw, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRecipePDF } from "@/lib/utils/recipePdf";

// Paleta de colores recomendados para clínicas
const COLOR_PRESETS = [
  { name: "FemeSalud Violeta", hex: "#992ACB" },
  { name: "Medizen Azul", hex: "#4361EE" },
  { name: "Teal Clínico", hex: "#0D9488" },
  { name: "Verde Salud", hex: "#059669" },
  { name: "Rosa Materno", hex: "#DB2777" },
  { name: "Azul Marino", hex: "#1E3A8A" },
  { name: "Gris Pizarra", hex: "#334155" },
];

// Muestras de indicaciones para la vista previa
const SAMPLE_PRESCRIPTIONS = {
  ginecologia: {
    label: "Ginecología & Obstetricia",
    patientName: "Katherine Álvarez",
    documentId: "V-24.891.203",
    age: "28 años",
    items: [
      {
        num: "1",
        name: "Ácido Fólico 5 mg (Comprimidos)",
        instructions: "Tomar 1 comprimido vía oral cada 24 horas por 90 días.",
      },
      {
        num: "2",
        name: "Calcio + Vitamina D3 (600 mg / 400 UI)",
        instructions: "Tomar 1 tableta vía oral diariamente junto con el desayuno.",
      },
      {
        num: "3",
        name: "Progesterona Micronizada 200 mg (Cápsulas blandas)",
        instructions: "Aplicar 1 óvulo por vía vaginal cada noche antes de acostarse por 14 días.",
      },
    ],
  },
  general: {
    label: "Medicina General",
    patientName: "Carlos Eduardo Mendoza",
    documentId: "V-18.432.109",
    age: "36 años",
    items: [
      {
        num: "1",
        name: "Amoxicilina + Ácido Clavulánico 875/125 mg",
        instructions: "Tomar 1 comprimido vía oral cada 12 horas por 7 días después de comer.",
      },
      {
        num: "2",
        name: "Ibuprofeno 400 mg (Cápsulas)",
        instructions: "Tomar 1 cápsula cada 8 horas por 3 días sólo en caso de dolor o fiebre.",
      },
      {
        num: "3",
        name: "Reposo Médico",
        instructions: "Reposo relativo por 48 horas con abundante ingesta de líquidos.",
      },
    ],
  },
};

export function RecipeDesigner() {
  const { data: clinic, isLoading } = useClinicInfo();
  const updateClinic = useUpdateClinicInfo();

  // Logged-in doctor profile for realistic preview
  const { user } = useAuthSession();
  const { data: profile } = useMyProfile(user?.id);

  const doctorName = profile?.full_name || "Dra. Carli Solé Aquino";
  const doctorSpecialty = profile?.specialty || "Ginecóloga - Obstetra";
  const doctorUniversity = profile?.university || "Universidad de Carabobo (UC - CHET)";
  const doctorMpps = profile?.mpps || "102.927";
  const doctorCmc = profile?.cmc || "11.619";

  // Form states
  const [logoBase64, setLogoBase64] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#992ACB");
  const [fontFamily, setFontFamily] = useState("font-serif");
  const [headerText, setHeaderText] = useState("#Gente Que Suma");
  const [footerText, setFooterText] = useState("");

  const [clinicName, setClinicName] = useState("FemeSalud");
  const [clinicType, setClinicType] = useState("Consultorio Ginecológico Obstétrico");
  const [addressLine1, setAddressLine1] = useState("Calle las Flores entre González Padrón y Shettino, N° 16");
  const [addressLine2, setAddressLine2] = useState("Valle de la Pascua, Estado Guárico");
  const [clinicPhone, setClinicPhone] = useState("0412/8299890 0412/7786873");
  const [clinicRif, setClinicRif] = useState("J-502316876");

  // UI state
  const [activeTab, setActiveTab] = useState<"brand" | "clinic" | "texts">("brand");
  const [zoom, setZoom] = useState<number>(100);
  const [sampleType, setSampleType] = useState<"ginecologia" | "general">("ginecologia");
  const [isExportingSample, setIsExportingSample] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when clinic data loads
  useEffect(() => {
    if (clinic) {
      if (clinic.recipe_logo_url) setLogoBase64(clinic.recipe_logo_url);
      if (clinic.recipe_primary_color) setPrimaryColor(clinic.recipe_primary_color);
      if (clinic.recipe_font_family) setFontFamily(clinic.recipe_font_family);
      if (clinic.recipe_header_text !== undefined) setHeaderText(clinic.recipe_header_text || "");
      if (clinic.recipe_footer_text !== undefined) setFooterText(clinic.recipe_footer_text || "");

      if (clinic.name) setClinicName(clinic.name);
      if (clinic.recipe_clinic_type) setClinicType(clinic.recipe_clinic_type);
      if (clinic.address_line1) setAddressLine1(clinic.address_line1);
      if (clinic.address_line2) setAddressLine2(clinic.address_line2);
      if (clinic.phone) setClinicPhone(clinic.phone);
      if (clinic.rif) setClinicRif(clinic.rif);
    }
  }, [clinic]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 1.5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoBase64(event.target.result as string);
        toast.success("Logo cargado con éxito");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await updateClinic.mutateAsync({
        name: clinicName.trim(),
        recipe_clinic_type: clinicType.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim(),
        phone: clinicPhone.trim(),
        rif: clinicRif.trim(),
        recipe_logo_url: logoBase64,
        recipe_primary_color: primaryColor,
        recipe_font_family: fontFamily,
        recipe_header_text: headerText.trim(),
        recipe_footer_text: footerText.trim(),
      });
      toast.success("Diseño del récipe guardado correctamente");
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar el diseño");
    }
  };

  const handleDownloadSample = async () => {
    try {
      setIsExportingSample(true);
      const currentSample = SAMPLE_PRESCRIPTIONS[sampleType];
      const indicationsText = currentSample.items
        .map((it) => `${it.num}. ${it.name}\n   ${it.instructions}`)
        .join("\n\n");

      await generateRecipePDF(
        {
          full_name: currentSample.patientName,
          document_id: currentSample.documentId,
          birth_date: "1998-05-14",
        },
        {
          created_at: new Date().toISOString(),
          indications: indicationsText,
        },
        doctorName,
        doctorSpecialty,
        doctorUniversity,
        doctorMpps,
        doctorCmc
      );
    } catch (err: any) {
      toast.error("No se pudo generar la muestra: " + (err?.message || "Error"));
    } finally {
      setIsExportingSample(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando configuración de récipe...</p>
      </div>
    );
  }

  const currentSample = SAMPLE_PRESCRIPTIONS[sampleType];

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* HEADER BAR */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Diseñador y Membrete de Récipes</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Personaliza la papelería médica oficial: logo, colores corporativos, tipografía y datos de contacto impresos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={handleDownloadSample}
            disabled={isExportingSample}
            variant="outline"
            className="rounded-xl border-border/60 hover:bg-muted font-bold text-xs h-10 px-3.5 flex-1 sm:flex-initial"
          >
            {isExportingSample ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1.5 text-primary" />
            )}
            Descargar Muestra PDF
          </Button>

          <Button
            onClick={handleSave}
            disabled={updateClinic.isPending}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 px-5 shadow-sm flex-1 sm:flex-initial"
          >
            {updateClinic.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS */}
        <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0 space-y-4">
          
          {/* Subtabs for clean organization */}
          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("brand")}
              className={cn(
                "py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "brand"
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette className="h-3.5 w-3.5" /> Marca
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clinic")}
              className={cn(
                "py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "clinic"
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="h-3.5 w-3.5" /> Clínica
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("texts")}
              className={cn(
                "py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "texts"
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5" /> Textos
            </button>
          </div>

          {/* TAB 1: BRAND IDENTITY & STYLE */}
          {activeTab === "brand" && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in-50 duration-200">
              
              {/* Logo Upload */}
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

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group p-3 text-center",
                    logoBase64
                      ? "border-primary/40 bg-primary/5 hover:border-primary"
                      : "border-border/60 hover:border-primary/60 hover:bg-muted/50"
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
                      <span className="text-[10px] text-muted-foreground">PNG transparente recomendado (Max 1.5MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* Corporate Color */}
              <div className="space-y-3 pt-1 border-t border-border/30">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Color Corporativo de la Papelería
                </Label>

                {/* Swatches presets */}
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
                          isSelected ? "scale-110 ring-2 ring-primary ring-offset-background" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: p.hex }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-xs stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Color input + Hex field */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl shadow-inner border border-border/60 overflow-hidden relative cursor-pointer ring-1 ring-border/50 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <input
                      type="color"
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

              {/* Typography Selector */}
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
                        <span className="font-serif font-bold text-sm">Clásica (Serif / Times)</span>
                        <span className="text-[11px] text-muted-foreground">Tradicional y formal — estándar médico</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="font-sans">
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-sans font-bold text-sm">Moderna (Sans-serif / Inter)</span>
                        <span className="text-[11px] text-muted-foreground">Limpia, contemporánea y minimalista</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="font-mono">
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-mono font-bold text-sm">Técnica (Monospace)</span>
                        <span className="text-[11px] text-muted-foreground">Estilo reporte de laboratorio / mecanografía</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}

          {/* TAB 2: CLINIC DETAILS */}
          {activeTab === "clinic" && (
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
          )}

          {/* TAB 3: TEXTS & SUBTITLE */}
          {activeTab === "texts" && (
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
          )}

          {/* Bottom Save Trigger */}
          <Button
            onClick={handleSave}
            disabled={updateClinic.isPending}
            className="w-full rounded-xl py-6 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {updateClinic.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Guardar Configuración
          </Button>

        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY PAPER PREVIEW */}
        <div className="flex-1 w-full bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl border border-border/50 p-3 sm:p-6 flex flex-col items-center min-h-[640px] relative shadow-inner overflow-hidden">
          
          {/* Top Preview Controls Toolbar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Vista Previa en Vivo (Formato A4/A5)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sample switcher */}
              <div className="flex items-center bg-card rounded-lg p-0.5 border border-border/50 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSampleType("ginecologia")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    sampleType === "ginecologia" ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ginecología
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType("general")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    sampleType === "general" ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  General
                </button>
              </div>

              {/* Zoom buttons */}
              <div className="hidden sm:flex items-center gap-1 bg-card rounded-lg p-0.5 border border-border/50">
                <button
                  type="button"
                  onClick={() => setZoom(75)}
                  className={cn("px-2 py-1 rounded text-[11px] font-bold", zoom === 75 ? "bg-muted text-primary" : "text-muted-foreground")}
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(90)}
                  className={cn("px-2 py-1 rounded text-[11px] font-bold", zoom === 90 ? "bg-muted text-primary" : "text-muted-foreground")}
                >
                  90%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  className={cn("px-2 py-1 rounded text-[11px] font-bold", zoom === 100 ? "bg-muted text-primary" : "text-muted-foreground")}
                >
                  100%
                </button>
              </div>
            </div>
          </div>

          {/* Paper View Container (Prevents clipping with m-auto and flex) */}
          <div className="w-full flex justify-start sm:justify-center overflow-x-auto py-2 px-1">
            <div 
              className="m-auto transition-transform duration-300 origin-top shrink-0"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              
              {/* Paper Sheet (Realistic Medical Stationery) */}
              <div 
                className={cn(
                  "bg-white text-slate-800 w-[360px] sm:w-[450px] md:w-[480px] aspect-[1/1.414] rounded-md shadow-xl border border-slate-200/90 flex flex-col relative select-none overflow-hidden",
                  fontFamily
                )}
              >
                
                {/* 1. PAPER HEADER (Membrete Oficial) */}
                <div className="pt-6 px-6 sm:px-8 pb-3 bg-white text-center">
                  
                  {/* Top micro info: address & contact */}
                  <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight mb-2 tracking-tight">
                    <div>{addressLine1 || "Calle las Flores entre González Padrón y Shettino, N° 16"}</div>
                    <div>{addressLine2 || "Valle de la Pascua, Estado Guárico"}</div>
                    <div className="font-medium mt-0.5 text-slate-600">
                      Teléfonos: {clinicPhone || "0412/8299890 0412/7786873"} {clinicRif ? `| RIF: ${clinicRif}` : ""}
                    </div>
                  </div>

                  {/* Main Letterhead Brand Row */}
                  <div className="flex items-center justify-between gap-3 mt-2">
                    
                    {/* Left Logo space */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                      {logoBase64 ? (
                        <img 
                          src={logoBase64} 
                          alt="Logo" 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed opacity-40 text-xs font-bold"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          Logo
                        </div>
                      )}
                    </div>

                    {/* Center branding */}
                    <div className="flex-1 text-center px-1">
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                        {clinicType || "Consultorio Ginecológico Obstétrico"}
                      </div>
                      <div 
                        className="text-xl sm:text-2xl font-bold tracking-tight my-0.5 transition-colors"
                        style={{ color: primaryColor }}
                      >
                        {clinicName || "FemeSalud"}
                      </div>
                      {headerText && (
                        <div className="text-[11px] sm:text-xs italic font-semibold text-slate-700">
                          {headerText}
                        </div>
                      )}
                    </div>

                    {/* Right spacer for symmetrical centering */}
                    <div className="w-14 sm:w-16 shrink-0"></div>
                  </div>

                  {/* Dual Divider Rule with Corporate Color */}
                  <div className="mt-3.5 space-y-[1.5px]">
                    <div className="h-[2px] w-full rounded-full transition-colors" style={{ backgroundColor: primaryColor }} />
                    <div className="h-[0.5px] w-full bg-slate-200" />
                  </div>
                </div>

                {/* 2. PAPER BODY */}
                <div className="flex-1 px-6 sm:px-8 py-3 flex flex-col relative bg-white">
                  
                  {/* Watermark in background */}
                  {logoBase64 ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                      <img 
                        src={logoBase64} 
                        alt="Watermark" 
                        className="w-60 h-60 object-contain opacity-[0.06] select-none scale-125" 
                      />
                    </div>
                  ) : (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-4xl sm:text-5xl font-black opacity-[0.04] z-0"
                      style={{ color: primaryColor }}
                    >
                      {clinicName || "FemeSalud"}
                    </div>
                  )}

                  {/* Date and Document Title */}
                  <div className="relative z-10 space-y-2">
                    <div className="text-right text-[10px] text-slate-500 font-medium">
                      Valle de la Pascua, {new Date().toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </div>

                    <div className="text-center pb-1">
                      <span className="text-xs sm:text-[13px] font-bold tracking-widest uppercase border-b border-slate-900 pb-0.5">
                        RÉCIPE / INDICACIONES
                      </span>
                    </div>

                    {/* Patient Metadata Grid */}
                    <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-2.5 text-[10px] sm:text-[11px] space-y-1.5 text-slate-700">
                      <div className="flex justify-between items-center">
                        <div><span className="font-bold text-slate-900">Paciente:</span> {currentSample.patientName}</div>
                        <div><span className="font-bold text-slate-900">Edad:</span> {currentSample.age}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div><span className="font-bold text-slate-900">C.I.:</span> {currentSample.documentId}</div>
                        <div className="text-slate-500 text-[10px]">Indicaciones Médicas</div>
                      </div>
                    </div>
                  </div>

                  {/* Rx Monogram and Realistic Prescriptions */}
                  <div className="relative z-10 mt-3 flex-1 flex flex-col">
                    
                    {/* Calligraphic Rx monogram */}
                    <div 
                      className="text-2xl sm:text-3xl font-serif font-black mb-1.5 select-none leading-none opacity-80"
                      style={{ color: primaryColor }}
                    >
                      Rx.
                    </div>

                    {/* Realistic Prescription Items */}
                    <div className="space-y-3 sm:space-y-3.5 pl-1">
                      {currentSample.items.map((item) => (
                        <div key={item.num} className="text-[10px] sm:text-[11px] leading-relaxed">
                          <div className="font-bold text-slate-900 flex items-baseline gap-1.5">
                            <span 
                              className="font-bold text-[11px] sm:text-xs" 
                              style={{ color: primaryColor }}
                            >
                              {item.num}.
                            </span>
                            <span>{item.name}</span>
                          </div>
                          <div className="text-slate-600 pl-4 mt-0.5 italic">
                            {item.instructions}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Doctor Signature & Stamp Block */}
                    <div className="mt-auto pt-6 pb-2 flex flex-col items-center relative">
                      
                      {/* Realistic simulated medical stamp badge */}
                      <div 
                        className="absolute right-4 bottom-5 border-2 rounded-lg p-1.5 text-[8px] sm:text-[8.5px] uppercase font-bold tracking-tight text-center rotate-[-4deg] opacity-75 shadow-xs pointer-events-none hidden sm:block"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <div>{doctorName}</div>
                        <div className="text-[7px] text-slate-500">{doctorSpecialty}</div>
                        <div className="font-mono text-[7.5px] mt-0.5">MPPS: {doctorMpps}</div>
                      </div>

                      {/* Signature line */}
                      <div className="w-52 sm:w-60 border-t border-slate-400 text-center pt-1.5 space-y-0.5">
                        <div className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight">
                          {doctorName}
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] text-slate-600 font-medium">
                          {doctorSpecialty}
                        </div>
                        <div className="text-[8.5px] text-slate-500">
                          {doctorUniversity}
                        </div>
                        <div className="text-[8.5px] font-mono font-semibold text-slate-600">
                          M.P.P.S: {doctorMpps} &nbsp;|&nbsp; C.M.C: {doctorCmc}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* 3. PAPER FOOTER */}
                <div className="py-2 px-6 bg-slate-50/80 border-t border-slate-100 text-center text-[8.5px] text-slate-400">
                  {footerText ? (
                    <div>{footerText}</div>
                  ) : (
                    <div>
                      {addressLine1 || "Calle las Flores"} • Valle de la Pascua • Guárico • Contacto: {clinicPhone || "0412/8299890"}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>

          <div className="mt-3 text-center text-[11px] text-muted-foreground">
            Documento configurado en formato estándar de imprenta clínica con membrete y marca de agua.
          </div>

        </div>

      </div>

    </div>
  );
}
