import { format, addDays, differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export interface ObstetricCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  fumDateFormatted?: string;
  fppDateFormatted?: string;
  fppDateIso?: string;
  gestationalWeeks?: number;
  gestationalDays?: number;
  gestationalAgeFormatted?: string;
  trimester?: 1 | 2 | 3;
  trimesterLabel?: string;
  progressPercentage?: number;
}

/**
 * Calculates Gestational Age (EG) and Expected Delivery Date (FPP)
 * using Naegele's rule (FUM + 280 days).
 */
export function calculateObstetricDates(fumInput: string | Date | null | undefined): ObstetricCalculationResult {
  if (!fumInput) {
    return { isValid: false, errorMessage: "Ingrese la fecha de última menstruación (FUM/FUR)." };
  }

  const fum = typeof fumInput === "string" ? parseISO(fumInput) : fumInput;

  if (!isValid(fum)) {
    return { isValid: false, errorMessage: "Fecha de FUM no válida." };
  }

  const today = new Date();
  const daysDiff = differenceInCalendarDays(today, fum);

  if (daysDiff < 0) {
    return { isValid: false, errorMessage: "La FUM no puede ser una fecha en el futuro." };
  }

  if (daysDiff > 315) {
    // Over 45 weeks
    return { isValid: false, errorMessage: "La fecha supera las 45 semanas de gestación." };
  }

  // Naegele's Rule: FUM + 280 days (40 weeks)
  const fpp = addDays(fum, 280);

  const weeks = Math.floor(daysDiff / 7);
  const remainingDays = daysDiff % 7;

  let trimester: 1 | 2 | 3 = 1;
  let trimesterLabel = "1er Trimestre (Semanas 1 a 13)";

  if (weeks >= 14 && weeks <= 27) {
    trimester = 2;
    trimesterLabel = "2do Trimestre (Semanas 14 a 27)";
  } else if (weeks >= 28) {
    trimester = 3;
    trimesterLabel = "3er Trimestre (Semana 28 a Término)";
  }

  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysDiff / 280) * 100)));

  return {
    isValid: true,
    fumDateFormatted: format(fum, "dd 'de' MMMM 'de' yyyy", { locale: es }),
    fppDateFormatted: format(fpp, "dd 'de' MMMM 'de' yyyy", { locale: es }),
    fppDateIso: format(fpp, "yyyy-MM-dd"),
    gestationalWeeks: weeks,
    gestationalDays: remainingDays,
    gestationalAgeFormatted: `${weeks} sem ${remainingDays > 0 ? `+ ${remainingDays} d` : ""}`,
    trimester,
    trimesterLabel,
    progressPercentage,
  };
}

export interface BmiEvaluation {
  bmi: number;
  bmiFormatted: string;
  category: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  minIdealWeight: string;
  maxIdealWeight: string;
  recommendation: string;
}

/**
 * Calculates BMI (Índice de Masa Corporal) and clinical classification according to WHO standards.
 */
export function calculateBmiWithCategory(
  weightKgInput: number | string | null | undefined,
  heightCmInput: number | string | null | undefined
): BmiEvaluation | null {
  const weight = typeof weightKgInput === "string" ? parseFloat(weightKgInput) : weightKgInput;
  const heightCm = typeof heightCmInput === "string" ? parseFloat(heightCmInput) : heightCmInput;

  if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const bmiFormatted = bmi.toFixed(1);

  const minIdeal = (18.5 * heightM * heightM).toFixed(1);
  const maxIdeal = (24.9 * heightM * heightM).toFixed(1);

  if (bmi < 18.5) {
    return {
      bmi,
      bmiFormatted,
      category: "Bajo Peso",
      colorClass: "text-sky-600 dark:text-sky-400",
      bgClass: "bg-sky-500/10",
      borderClass: "border-sky-500/30",
      minIdealWeight: minIdeal,
      maxIdealWeight: maxIdeal,
      recommendation: "Evaluar balance calórico y descartar déficit nutricional.",
    };
  }

  if (bmi < 25.0) {
    return {
      bmi,
      bmiFormatted,
      category: "Peso Saludable / Normal",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      minIdealWeight: minIdeal,
      maxIdealWeight: maxIdeal,
      recommendation: "Mantener régimen de alimentación balanceada y actividad regular.",
    };
  }

  if (bmi < 30.0) {
    return {
      bmi,
      bmiFormatted,
      category: "Sobrepeso",
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      minIdealWeight: minIdeal,
      maxIdealWeight: maxIdeal,
      recommendation: "Monitoreo preventivo, ajuste dietético y ejercicio aeróbico.",
    };
  }

  if (bmi < 35.0) {
    return {
      bmi,
      bmiFormatted,
      category: "Obesidad Clase I",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
      minIdealWeight: minIdeal,
      maxIdealWeight: maxIdeal,
      recommendation: "Riesgo cardiovascular aumentado. Plan nutricional especializado.",
    };
  }

  if (bmi < 40.0) {
    return {
      bmi,
      bmiFormatted,
      category: "Obesidad Clase II (Severa)",
      colorClass: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-500/15",
      borderClass: "border-rose-500/35",
      minIdealWeight: minIdeal,
      maxIdealWeight: maxIdeal,
      recommendation: "Riesgo alto de comorbilidades. Intervención médica multidisciplinaria.",
    };
  }

  return {
    bmi,
    bmiFormatted,
    category: "Obesidad Clase III (Mórbida)",
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500/40",
    minIdealWeight: minIdeal,
    maxIdealWeight: maxIdeal,
    recommendation: "Prioridad médica alta. Control metabólico y seguimiento estricto.",
  };
}
