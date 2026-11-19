import React from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PrescriptionSample {
  label: string;
  patientName: string;
  documentId: string;
  age: string;
  items: Array<{ num: string; name: string; instructions: string }>;
}

export interface RecipeLivePreviewProps {
  sampleType: "ginecologia" | "general";
  setSampleType: (type: "ginecologia" | "general") => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  fontFamily: string;
  addressLine1: string;
  addressLine2: string;
  clinicPhone: string;
  clinicRif: string;
  logoBase64: string;
  primaryColor: string;
  clinicType: string;
  clinicName: string;
  headerText: string;
  footerText: string;
  previewDateStr: string;
  currentSample: PrescriptionSample;
  doctorName: string;
  doctorSpecialty: string;
  doctorUniversity: string;
  doctorMpps: string;
  doctorCmc: string;
}

interface ToolbarProps {
  sampleType: "ginecologia" | "general";
  setSampleType: (type: "ginecologia" | "general") => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

function RecipeLivePreviewToolbar({ sampleType, setSampleType, zoom, setZoom }: ToolbarProps) {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/40">
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-primary" /> Vista Previa en Vivo (Formato A4/A5)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-card rounded-lg p-0.5 border border-border/50 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setSampleType("ginecologia")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors",
              sampleType === "ginecologia"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ginecología
          </button>
          <button
            type="button"
            onClick={() => setSampleType("general")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-colors",
              sampleType === "general"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            General
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 bg-card rounded-lg p-0.5 border border-border/50">
          {[75, 90, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setZoom(val)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-bold",
                zoom === val ? "bg-muted text-primary" : "text-muted-foreground",
              )}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PaperSheetProps {
  fontFamily: string;
  addressLine1: string;
  addressLine2: string;
  clinicPhone: string;
  clinicRif: string;
  logoBase64: string;
  primaryColor: string;
  clinicType: string;
  clinicName: string;
  headerText: string;
  footerText: string;
  previewDateStr: string;
  currentSample: PrescriptionSample;
  doctorName: string;
  doctorSpecialty: string;
  doctorUniversity: string;
  doctorMpps: string;
  doctorCmc: string;
}

function RecipePaperSheet({
  fontFamily,
  addressLine1,
  addressLine2,
  clinicPhone,
  clinicRif,
  logoBase64,
  primaryColor,
  clinicType,
  clinicName,
  headerText,
  footerText,
  previewDateStr,
  currentSample,
  doctorName,
  doctorSpecialty,
  doctorUniversity,
  doctorMpps,
  doctorCmc,
}: PaperSheetProps) {
  return (
    <div
      className={cn(
        "bg-white text-slate-800 w-[360px] sm:w-[450px] md:w-[480px] aspect-[1/1.414] rounded-md shadow-xl border border-slate-200/90 flex flex-col relative select-none overflow-hidden",
        fontFamily,
      )}
    >
      {/* 1. PAPER HEADER */}
      <div className="pt-6 px-6 sm:px-8 pb-3 bg-white text-center">
        <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight mb-2 tracking-tight">
          <div>{addressLine1 || "Calle las Flores entre González Padrón y Shettino, N° 16"}</div>
          <div>{addressLine2 || "Valle de la Pascua, Estado Guárico"}</div>
          <div className="font-medium mt-0.5 text-slate-600">
            Teléfonos: {clinicPhone || "0412/8299890 0412/7786873"}{" "}
            {clinicRif ? `| RIF: ${clinicRif}` : ""}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed opacity-40 text-xs font-bold"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Logo
              </div>
            )}
          </div>

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

          <div className="w-14 sm:w-16 shrink-0" />
        </div>

        <div className="mt-3.5 space-y-[1.5px]">
          <div
            className="h-[2px] w-full rounded-full transition-colors"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="h-[0.5px] w-full bg-slate-200" />
        </div>
      </div>

      {/* 2. PAPER BODY */}
      <div className="flex-1 px-6 sm:px-8 py-3 flex flex-col relative bg-white">
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

        <div className="relative z-10 space-y-2">
          <div suppressHydrationWarning className="text-right text-[10px] text-slate-500 font-medium">
            Valle de la Pascua, {previewDateStr}
          </div>

          <div className="text-center pb-1">
            <span className="text-xs sm:text-[13px] font-bold tracking-widest uppercase border-b border-slate-900 pb-0.5">
              RÉCIPE / INDICACIONES
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-2.5 text-[10px] sm:text-[11px] space-y-1.5 text-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">Paciente:</span>{" "}
                {currentSample.patientName}
              </div>
              <div>
                <span className="font-bold text-slate-900">Edad:</span> {currentSample.age}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">C.I.:</span> {currentSample.documentId}
              </div>
              <div className="text-slate-500 text-[10px]">Indicaciones Médicas</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-3 flex-1 flex flex-col">
          <div
            className="text-2xl sm:text-3xl font-serif font-black mb-1.5 select-none leading-none opacity-80"
            style={{ color: primaryColor }}
          >
            Rx.
          </div>

          <div className="space-y-3 sm:space-y-3.5 pl-1">
            {currentSample.items.map((item) => (
              <div key={item.num} className="text-[10px] sm:text-[11px] leading-relaxed">
                <div className="font-bold text-slate-900 flex items-baseline gap-1.5">
                  <span className="font-bold text-[11px] sm:text-xs" style={{ color: primaryColor }}>
                    {item.num}.
                  </span>
                  <span>{item.name}</span>
                </div>
                <div className="text-slate-600 pl-4 mt-0.5 italic">{item.instructions}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 pb-2 flex flex-col items-center relative">
            <div
              className="absolute right-4 bottom-5 border-2 rounded-lg p-1.5 text-[8px] sm:text-[8.5px] uppercase font-bold tracking-tight text-center rotate-[-4deg] opacity-75 shadow-xs pointer-events-none hidden sm:block"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <div>{doctorName}</div>
              <div className="text-[7px] text-slate-500">{doctorSpecialty}</div>
              <div className="font-mono text-[7.5px] mt-0.5">MPPS: {doctorMpps}</div>
            </div>

            <div className="w-52 sm:w-60 border-t border-slate-400 text-center pt-1.5 space-y-0.5">
              <div className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight">
                {doctorName}
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-slate-600 font-medium">
                {doctorSpecialty}
              </div>
              <div className="text-[8.5px] text-slate-500">{doctorUniversity}</div>
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
            {addressLine1 || "Calle las Flores"} • Valle de la Pascua • Guárico • Contacto:{" "}
            {clinicPhone || "0412/8299890"}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecipeLivePreview(props: RecipeLivePreviewProps) {
  const { sampleType, setSampleType, zoom, setZoom } = props;

  return (
    <div className="flex-1 w-full bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl border border-border/50 p-3 sm:p-6 flex flex-col items-center min-h-[640px] relative shadow-inner overflow-hidden">
      <RecipeLivePreviewToolbar
        sampleType={sampleType}
        setSampleType={setSampleType}
        zoom={zoom}
        setZoom={setZoom}
      />

      <div className="w-full flex justify-start sm:justify-center overflow-x-auto py-2 px-1">
        <div
          className="m-auto transition-transform duration-300 origin-top shrink-0"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <RecipePaperSheet {...props} />
        </div>
      </div>

      <div className="mt-3 text-center text-[11px] text-muted-foreground">
        Documento configurado en formato estándar de imprenta clínica con membrete y marca de agua.
      </div>
    </div>
  );
}
