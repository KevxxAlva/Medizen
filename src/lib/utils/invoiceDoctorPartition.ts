/**
 * Asignación global, determinista y biyectiva de facturas por médico.
 *
 * Propiedades matemáticas garantizadas:
 * 1. Cada factura pertenece a lo sumo a 1 médico (o sin asignar si fue emitida sin cita ni médico).
 * 2. La intersección entre los ingresos de dos doctores es estrictamente vacía:
 *    Set(Facturas Dr A) ∩ Set(Facturas Dr B) = ∅.
 * 3. Suma(Dr 1) + Suma(Dr 2) + ... + Suma(Dr N) + Suma(Sin Asignar) === Total Global de Facturación (Admin).
 */

export interface PartitionInvoiceInput {
  id_factura: number;
  id_paciente?: number | string | null;
  fecha_emision?: string | null;
  total_general?: number | string | null;
  [key: string]: any;
}

export interface PartitionAppointmentInput {
  id_cita?: number | string;
  id?: number | string;
  id_paciente?: number | string | null;
  patient_id?: number | string | null;
  id_medico?: number | string | null;
  doctor_id?: number | string | null;
  fecha_hora?: string | null;
  scheduled_at?: string | null;
  estado?: string | null;
  status?: string | null;
  [key: string]: any;
}

export function partitionInvoicesByDoctor<
  TInv extends PartitionInvoiceInput,
  TAppt extends PartitionAppointmentInput
>(input: { invoices: TInv[]; appointments: TAppt[] }): Map<number, number> {
  const { invoices, appointments } = input;
  const assignment = new Map<number, number>(); // id_factura -> doctorId

  if (!invoices.length || !appointments.length) {
    return assignment;
  }

  // 1. Normalizar citas válidas (no canceladas) y con médico y paciente válidos
  const validAppts = appointments
    .filter((a) => {
      const st = (a.estado || a.status || "").toLowerCase();
      return !["cancelada", "cancelado", "cancelled"].includes(st);
    })
    .map((a) => {
      const citaId = Number(a.id_cita ?? a.id);
      const patientId = Number(a.id_paciente ?? a.patient_id);
      const doctorId = Number(a.id_medico ?? a.doctor_id);
      const isCompleted = (a.estado || a.status || "").toLowerCase() === "completada";
      const time = (a.fecha_hora || a.scheduled_at)
        ? new Date(a.fecha_hora || a.scheduled_at!).getTime()
        : 0;
      return { citaId, patientId, doctorId, time, isCompleted };
    })
    .filter((a) => !isNaN(a.citaId) && !isNaN(a.patientId) && !isNaN(a.doctorId) && a.doctorId > 0 && a.patientId > 0);

  // Agrupar citas por id_paciente
  const apptsByPatient = new Map<number, typeof validAppts>();
  for (const appt of validAppts) {
    const list = apptsByPatient.get(appt.patientId) || [];
    list.push(appt);
    apptsByPatient.set(appt.patientId, list);
  }

  // 2. Emparejamiento biyectivo / greedy 1-a-1 por cercanía temporal
  interface Pair {
    invId: number;
    citaId: number;
    doctorId: number;
    isCompleted: boolean;
    distance: number;
  }

  const pairs: Pair[] = [];

  for (const inv of invoices) {
    const pId = Number(inv.id_paciente);
    if (!pId) continue;
    const patAppts = apptsByPatient.get(pId);
    if (!patAppts || patAppts.length === 0) continue;

    const invTime = inv.fecha_emision ? new Date(inv.fecha_emision).getTime() : 0;

    for (const appt of patAppts) {
      const distance = Math.abs(invTime - appt.time);
      pairs.push({
        invId: Number(inv.id_factura),
        citaId: appt.citaId,
        doctorId: appt.doctorId,
        isCompleted: appt.isCompleted,
        distance,
      });
    }
  }

  // Ordenar candidatos:
  // 1. Prioridad a citas completadas para facturas emitidas
  // 2. Menor distancia temporal
  // 3. Desempate determinista por citaId e invId
  pairs.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? -1 : 1;
    }
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.citaId !== b.citaId) return a.citaId - b.citaId;
    return a.invId - b.invId;
  });

  const claimedInvoices = new Set<number>();
  const claimedCitas = new Set<number>();

  for (const pair of pairs) {
    if (claimedInvoices.has(pair.invId) || claimedCitas.has(pair.citaId)) continue;
    claimedInvoices.add(pair.invId);
    claimedCitas.add(pair.citaId);
    assignment.set(pair.invId, pair.doctorId);
  }

  // 3. Para facturas restantes no emparejadas 1-a-1: si el paciente sólo ha sido
  // atendido por un único doctor en la clínica, se atribuye a ese doctor.
  for (const inv of invoices) {
    const invId = Number(inv.id_factura);
    if (assignment.has(invId)) continue;
    const pId = Number(inv.id_paciente);
    if (!pId) continue;

    const patAppts = apptsByPatient.get(pId);
    if (!patAppts || patAppts.length === 0) continue;

    const uniqueDoctors = new Set(patAppts.map((a) => a.doctorId));
    if (uniqueDoctors.size === 1) {
      const soleDoctor = uniqueDoctors.values().next().value;
      if (soleDoctor) {
        assignment.set(invId, soleDoctor);
      }
    }
  }

  return assignment;
}

export function getInvoicesForDoctor<
  TInv extends PartitionInvoiceInput,
  TAppt extends PartitionAppointmentInput
>(invoices: TInv[], appointments: TAppt[], doctorId: number | string | null | undefined): TInv[] {
  const numDoctorId = Number(doctorId);
  if (!numDoctorId) return [];
  const assignment = partitionInvoicesByDoctor({ invoices, appointments });
  return invoices.filter((inv) => assignment.get(Number(inv.id_factura)) === numDoctorId);
}
