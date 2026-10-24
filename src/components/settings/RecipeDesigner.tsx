import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React, { useState, useEffect, useMemo } from "react";
import { useClinicInfo, useUpdateClinicInfo } from "@/lib/api/clinic";
import { useAuthSession } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Download,
  Sparkles,
} from "lucide-react";
import { generateRecipePDF } from "@/lib/utils/recipePdf";
import { RecipeControlsPanel } from "./RecipeControlsPanel";
import { RecipeLivePreview, PrescriptionSample } from "./RecipeLivePreview";

const SAMPLE_PRESCRIPTIONS: Record<"ginecologia" | "general", PrescriptionSample> = {
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
        instructions: "Tomar 1 tableta vía oral junto con el desayuno.",
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
  const { data: clinic, isLoading } = useClinicInfo({ includeLogo: true });
  const updateClinic = useUpdateClinicInfo();

  // Logged-in doctor profile for realistic preview
  const { user } = useAuthSession();
  const { data: profile } = useMyProfile(user?.id);

  const doctorName = profile?.full_name || "Dra. Carli Solé Aquino";
  const doctorSpecialty = profile?.specialty || "Ginecóloga - Obstetra";
  const doctorUniversity = profile?.university || "Universidad de Carabobo (UC - CHET)";
  const doctorMpps = profile?.mpps || "102.927";
  const doctorCmc = profile?.cmc || "11.619";

  const previewDateStr = useMemo(
    () =>
      new Date().toLocaleDateString("es-VE", {
        timeZone: APP_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [],
  );

  // Form states
  const [logoBase64, setLogoBase64] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#992ACB");
  const [fontFamily, setFontFamily] = useState("font-serif");
  const [headerText, setHeaderText] = useState("#Gente Que Suma");
  const [footerText, setFooterText] = useState("");

  const [clinicName, setClinicName] = useState("FemeSalud");
  const [clinicType, setClinicType] = useState("Consultorio Ginecológico Obstétrico");
  const [addressLine1, setAddressLine1] = useState(
    "Calle las Flores entre González Padrón y Shettino, N° 16",
  );
  const [addressLine2, setAddressLine2] = useState("Valle de la Pascua, Estado Guárico");
  const [clinicPhone, setClinicPhone] = useState("0412/8299890 0412/7786873");
  const [clinicRif, setClinicRif] = useState("J-502316876");

  // UI state
  const [activeTab, setActiveTab] = useState<"brand" | "clinic" | "texts">("brand");
  const [zoom, setZoom] = useState<number>(100);
  const [sampleType, setSampleType] = useState<"ginecologia" | "general">("ginecologia");
  const [isExportingSample, setIsExportingSample] = useState(false);

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
        doctorCmc,
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
        <p className="text-sm font-medium text-muted-foreground">
          Cargando configuración de récipe...
        </p>
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
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Diseñador y Membrete de Récipes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Personaliza la papelería médica oficial: logo, colores corporativos, tipografía y datos
            de contacto impresos.
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
        <RecipeControlsPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logoBase64={logoBase64}
          setLogoBase64={setLogoBase64}
          onLogoUpload={handleImageUpload}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
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
          headerText={headerText}
          setHeaderText={setHeaderText}
          footerText={footerText}
          setFooterText={setFooterText}
          onSave={handleSave}
          isSaving={updateClinic.isPending}
        />

        <RecipeLivePreview
          sampleType={sampleType}
          setSampleType={setSampleType}
          zoom={zoom}
          setZoom={setZoom}
          fontFamily={fontFamily}
          addressLine1={addressLine1}
          addressLine2={addressLine2}
          clinicPhone={clinicPhone}
          clinicRif={clinicRif}
          logoBase64={logoBase64}
          primaryColor={primaryColor}
          clinicType={clinicType}
          clinicName={clinicName}
          headerText={headerText}
          footerText={footerText}
          previewDateStr={previewDateStr}
          currentSample={currentSample}
          doctorName={doctorName}
          doctorSpecialty={doctorSpecialty}
          doctorUniversity={doctorUniversity}
          doctorMpps={doctorMpps}
          doctorCmc={doctorCmc}
        />
      </div>
    </div>
  );
}
