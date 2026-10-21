import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicalAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  author_id: string | null;
  title: string;
  content: string;
  note_date: string;
  attachments: ClinicalAttachment[];
  created_at: string;
  updated_at: string;
}

export type ClinicalNoteInput = {
  patient_id: string;
  title: string;
  content?: string;
  note_date?: string;
  attachments?: ClinicalAttachment[];
};

export const CLINICAL_BUCKET = "clinical-attachments";

export function useClinicalNotes(patientId: string | undefined) {
  return useQuery({
    queryKey: ["clinical_notes", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<ClinicalNote[]> => {
      const pid = parseInt(patientId!, 10);
      if (isNaN(pid)) return [];

      const [{ data: hc }, { data: files }] = await Promise.all([
        supabase
          .from("historias_clinicas")
          .select("datos_extras")
          .eq("id_paciente", pid)
          .maybeSingle(),
        supabase
          .from("archivos_pacientes")
          .select("*")
          .eq("id_paciente", pid)
          .order("fecha_subida", { ascending: false }),
      ]);

      const extras =
        typeof hc?.datos_extras === "object" && hc?.datos_extras !== null
          ? (hc.datos_extras as Record<string, any>)
          : {};

      const storedNotes: ClinicalNote[] = Array.isArray(extras.clinical_notes)
        ? extras.clinical_notes.map((n: any) => ({
            ...n,
            attachments: Array.isArray(n.attachments) ? n.attachments : [],
          }))
        : [];

      // Include any standalone rows in archivos_pacientes not already linked inside a note
      const linkedPaths = new Set(
        storedNotes.flatMap((n) => (n.attachments || []).map((a) => a.path))
      );
      const standaloneFileNotes: ClinicalNote[] = (files ?? [])
        .filter((f) => !linkedPaths.has(f.ruta_archivo))
        .map((f) => ({
          id: `file-${f.id}`,
          patient_id: patientId!,
          author_id: null,
          title: `Estudio / Archivo: ${f.nombre_archivo}`,
          content: "Documento clínico adjunto al expediente del paciente.",
          note_date: f.fecha_subida || new Date().toISOString(),
          attachments: [
            {
              path: f.ruta_archivo,
              name: f.nombre_archivo,
              type: f.tipo_archivo || "application/octet-stream",
              size: f.tamano_bytes || 0,
            },
          ],
          created_at: f.fecha_subida || new Date().toISOString(),
          updated_at: f.fecha_subida || new Date().toISOString(),
        }));

      return [...storedNotes, ...standaloneFileNotes].sort(
        (a, b) => +new Date(b.note_date) - +new Date(a.note_date)
      );
    },
  });
}

export function useCreateClinicalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicalNoteInput) => {
      const pid = parseInt(input.patient_id, 10);
      const { data: u } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const newNote: ClinicalNote = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `note-${Date.now()}`,
        patient_id: input.patient_id,
        author_id: u.user?.id || null,
        title: input.title,
        content: input.content || "",
        note_date: input.note_date || now,
        attachments: input.attachments ?? [],
        created_at: now,
        updated_at: now,
      };

      // Register uploaded attachments in archivos_pacientes table
      if (input.attachments && input.attachments.length > 0 && !isNaN(pid)) {
        await supabase.from("archivos_pacientes").insert(
          input.attachments.map((a) => ({
            id_paciente: pid,
            nombre_archivo: a.name,
            ruta_archivo: a.path,
            tipo_archivo: a.type,
            tamano_bytes: a.size,
            fecha_subida: now,
          }))
        );
      }

      const { data: currentHc } = await supabase
        .from("historias_clinicas")
        .select("*")
        .eq("id_paciente", pid)
        .maybeSingle();

      const currentExtras =
        typeof currentHc?.datos_extras === "object" &&
        currentHc?.datos_extras !== null
          ? (currentHc.datos_extras as Record<string, any>)
          : {};

      const existingNotes = Array.isArray(currentExtras.clinical_notes)
        ? currentExtras.clinical_notes
        : [];

      const updatedExtras = {
        ...currentExtras,
        clinical_notes: [newNote, ...existingNotes],
      };

      const { error } = await supabase.from("historias_clinicas").upsert(
        {
          ...(currentHc?.id_historia ? { id_historia: currentHc.id_historia } : {}),
          id_paciente: pid,
          datos_extras: updatedExtras,
        },
        { onConflict: "id_paciente" }
      );

      if (error) throw error;
      return newNote;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["clinical_notes", v.patient_id] });
      qc.invalidateQueries({ queryKey: ["patient", v.patient_id] });
    },
  });
}

export function useDeleteClinicalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patient_id,
      attachments,
    }: {
      id: string;
      patient_id: string;
      attachments?: ClinicalAttachment[];
    }) => {
      const pid = parseInt(patient_id, 10);
      if (attachments && attachments.length) {
        await supabase.storage
          .from(CLINICAL_BUCKET)
          .remove(attachments.map((a) => a.path));
        await supabase
          .from("archivos_pacientes")
          .delete()
          .in(
            "ruta_archivo",
            attachments.map((a) => a.path)
          );
      }

      if (id.startsWith("file-")) {
        const fileId = id.replace("file-", "");
        await supabase.from("archivos_pacientes").delete().eq("id", fileId);
        return;
      }

      const { data: currentHc } = await supabase
        .from("historias_clinicas")
        .select("*")
        .eq("id_paciente", pid)
        .maybeSingle();

      if (!currentHc) return;
      const currentExtras =
        typeof currentHc.datos_extras === "object" &&
        currentHc.datos_extras !== null
          ? (currentHc.datos_extras as Record<string, any>)
          : {};

      const existingNotes = Array.isArray(currentExtras.clinical_notes)
        ? currentExtras.clinical_notes
        : [];

      const updatedExtras = {
        ...currentExtras,
        clinical_notes: existingNotes.filter((n: any) => n.id !== id),
      };

      const { error } = await supabase
        .from("historias_clinicas")
        .update({ datos_extras: updatedExtras })
        .eq("id_historia", currentHc.id_historia);

      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["clinical_notes", v.patient_id] });
      qc.invalidateQueries({ queryKey: ["patient", v.patient_id] });
    },
  });
}

export async function uploadClinicalAttachments(
  patientId: string,
  files: File[],
): Promise<ClinicalAttachment[]> {
  const out: ClinicalAttachment[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${patientId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
    const { error } = await supabase.storage.from(CLINICAL_BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    out.push({ path, name: file.name, type: file.type, size: file.size });
  }
  return out;
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(CLINICAL_BUCKET).createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}
