import { useState } from "react";
import { Building2, Sparkles, Loader2 } from "lucide-react";
import { useCreateClinica, type CreateClinicInput } from "@/lib/api/superadmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const EMPTY_FORM: CreateClinicInput = {
  nombre: "",
  slug: "",
  rif: "",
  telefono: "",
  direccion: "",
  plan: "pro",
  estado_inicial: "activo",
  admin_name: "",
  admin_email: "",
  admin_password: "",
  tipo_clinica: "Consultorio Ginecológico Obstétrico",
  color_primario: "#0ea5e9",
};

export function SuperAdminCreateClinicDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateClinica();
  const [formData, setFormData] = useState<CreateClinicInput>(EMPTY_FORM);

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending) return;
    if (!formData.nombre || !formData.slug || !formData.admin_email || !formData.admin_password) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      toast.success(
        formData.estado_inicial === "demo"
          ? `¡Clínica "${formData.nombre}" creada en Modo Demo (14 días)!`
          : `¡Clínica "${formData.nombre}" creada y activada con éxito!`,
      );
      onOpenChange(false);
      setFormData(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err.message || "Error al crear la clínica.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            Alta de Nueva Organización / Clínica
          </DialogTitle>
          <DialogDescription>
            Crea una nueva clínica con su propia base de datos aislada y genera su primer usuario administrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateClinic} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
              1. Información Institucional
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs">Nombre de la Clínica *</Label>
                <Input id="nombre" placeholder="Ej. Centro Médico San Pedro" value={formData.nombre} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs">Identificador / Subdominio (Slug) *</Label>
                <Input id="slug" placeholder="ej. san-pedro" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rif" className="text-xs">RIF / Identificación Fiscal</Label>
                <Input id="rif" placeholder="J-12345678-9" value={formData.rif} onChange={(e) => setFormData({ ...formData, rif: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="text-xs">Teléfono de Contacto (WhatsApp)</Label>
                <Input id="telefono" placeholder="+58 414 123 4567" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="direccion" className="text-xs">Dirección Física</Label>
                <Input id="direccion" placeholder="Av. Bolívar, Centro Médico Torre A, Piso 2" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
              2. Cuenta del Administrador / Especialista Principal
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin_name" className="text-xs">Nombre Completo *</Label>
                <Input id="admin_name" placeholder="Dra. María Pérez" value={formData.admin_name} onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin_email" className="text-xs">Correo Electrónico (Login) *</Label>
                <Input id="admin_email" type="email" placeholder="doctor@sanpedro.com" value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin_password" className="text-xs">Contraseña Inicial *</Label>
                <Input id="admin_password" type="password" placeholder="Mínimo 8 caracteres" value={formData.admin_password} onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
              3. Suscripción, Periodo de Prueba y Personalización
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan" className="text-xs">Plan de Suscripción</Label>
                <Select value={formData.plan} onValueChange={(val: any) => setFormData({ ...formData, plan: val })}>
                  <SelectTrigger id="plan"><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico — $15/mes (Hasta 2 médicos · 500 pac.)</SelectItem>
                    <SelectItem value="pro">Pro — $25/mes (Hasta 8 médicos · Finanzas + Inventario)</SelectItem>
                    <SelectItem value="enterprise">Enterprise — $45/mes (Ilimitado + Reportes y Auditoría)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado_inicial" className="text-xs">Modalidad de Activación</Label>
                <Select value={formData.estado_inicial || "activo"} onValueChange={(val: any) => setFormData({ ...formData, estado_inicial: val })}>
                  <SelectTrigger id="estado_inicial"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Suscripción Activa (30 días)</SelectItem>
                    <SelectItem value="demo">Prueba Gratuita / Demo (14 días)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color_primario" className="text-xs">Color de Identidad</Label>
                <div className="flex items-center gap-2">
                  <Input id="color_primario" type="color" className="w-10 h-10 p-1 rounded-lg cursor-pointer shrink-0" value={formData.color_primario} onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })} />
                  <Input value={formData.color_primario} onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })} className="font-mono text-xs uppercase" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo_clinica" className="text-xs">Especialidad Principal</Label>
                <Input id="tipo_clinica" placeholder="Consultorio Ginecológico" value={formData.tipo_clinica} onChange={(e) => setFormData({ ...formData, tipo_clinica: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2 font-semibold">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Configurando Clínica...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {formData.estado_inicial === "demo" ? "Crear Clínica en Demo (14 días)" : "Crear y Activar Clínica"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
