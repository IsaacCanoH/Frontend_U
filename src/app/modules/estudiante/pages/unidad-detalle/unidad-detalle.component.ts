import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EstudianteService } from '../../../../core/services/estudiante.service';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { AlertasService } from '../../../../core/services/alertas.service';

@Component({
  selector: 'app-unidad-detalle',
  templateUrl: './unidad-detalle.component.html',
  styleUrls: ['./unidad-detalle.component.scss']
})
export class UnidadDetalleComponent implements OnInit {
  unidad: any = null;
  cargando = false;
  estudianteUnidadId: number | null = null;
  assignedServices: any[] = [];
  serviciosSeleccionadosExtras: number[] = [];
  isProcessingExtras = false;

  constructor(
    private route: ActivatedRoute,
    private estudianteService: EstudianteService,
    private serviciosService: ServiciosService,
    private alertasService: AlertasService
  ) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    if (id) this.cargar(id);
  }

  cargar(id: number) {
    this.cargando = true;

    // 👇 Resetear estado local para no arrastrar selección de otra unidad / intento previo
    this.unidad = null;
    this.assignedServices = [];
    this.serviciosSeleccionadosExtras = [];

    this.estudianteService.obtenerUnidadAsignada(id).subscribe({
      next: async (res) => {
        this.unidad = res.data;
        this.estudianteUnidadId = this.unidad?.estudiante_unidad_id ?? null;
        if (this.estudianteUnidadId) {
          await this.loadAssignedServices();
        }
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando unidad:', err);
        // 👇 también limpiar en caso de error para no dejar selección basura
        this.assignedServices = [];
        this.serviciosSeleccionadosExtras = [];
      }
    });
  }


  get serviciosBase(): any[] {
    const lista = this.unidad?.descripcion?.servicios || [];
    return lista
      .map((s: any) => (typeof s === 'object' ? s : { nombre: s }))
      .filter((s: any) => !!s && s.es_base === true);
  }

  get serviciosExtras(): any[] {
    const lista = this.unidad?.descripcion?.servicios || [];
    return lista
      .map((s: any) => (typeof s === 'object' ? s : { nombre: s }))
      .filter((s: any) => !!s && s.es_base === false);
  }

  // 👉 Servicio extra bloqueado si tiene fecha_fin futura
  isExtraBlocked(servicioId: number): boolean {
    const s = this.assignedServices.find(
      (srv: any) => Number(srv.id) === Number(servicioId)
    );
    if (!s || !s.estudiante_unidad_servicio) return false;

    const link = s.estudiante_unidad_servicio;
    if (!link.fecha_fin) return false;

    const now = new Date();
    const ff = new Date(link.fecha_fin);

    return ff > now;
  }

  toggleExtra(servicioId: number): void {
    const id = Number(servicioId);

    // 👉 No permitir cambiar un extra bloqueado (cancelado pero aún vigente)
    if (this.isExtraBlocked(id)) return;

    const i = this.serviciosSeleccionadosExtras.indexOf(id);
    if (i === -1) this.serviciosSeleccionadosExtras.push(id);
    else this.serviciosSeleccionadosExtras.splice(i, 1);
  }

  isExtraSelected(servicioId: number): boolean {
    return this.serviciosSeleccionadosExtras.includes(Number(servicioId));
  }

  // 👉 Sincronizar selección solo con EXTRAS vigentes (no base, sin fecha_fin pasada)
  private syncSelectedExtras(): void {
    const now = new Date();
    const extrasIds = (this.serviciosExtras || []).map((s: any) => Number(s.id));

    const seleccionados = this.assignedServices
      .filter((s: any) => !s.es_base)
      .filter((s: any) => {
        const link = s.estudiante_unidad_servicio || {};
        const estado = String(link.estado || '').toLowerCase();
        const ff = link.fecha_fin ? new Date(link.fecha_fin) : null;

        // nunca marcar cancelados
        if (estado === 'cancelado') return false;
        // ni los que ya terminaron
        if (ff && ff <= now) return false;

        return true;
      })
      .map((s: any) => Number(s.id));

    // Solo extras válidos de esta unidad y sin duplicados
    this.serviciosSeleccionadosExtras = Array.from(
      new Set(
        seleccionados.filter((id: number) => extrasIds.includes(id))
      )
    );
  }



  async loadAssignedServices(): Promise<void> {
    if (!this.estudianteUnidadId) return;
    try {
      const resp = await firstValueFrom(
        this.serviciosService.obtenerServiciosPorAsignacion(this.estudianteUnidadId)
      );
      const raw = Array.isArray(resp) ? resp : (resp?.data ?? []);
      const now = new Date();

      // 👉 Guardar solo servicios cuyo vínculo siga vigente (sin fecha_fin pasada)
      this.assignedServices = raw.filter((s: any) => {
        const link = s.estudiante_unidad_servicio;
        if (!link) return true; // por si acaso
        const ff = link.fecha_fin ? new Date(link.fecha_fin) : null;
        return !ff || ff > now;
      });

      // 👉 actualizar checkboxes de extras
      this.syncSelectedExtras();
    } catch (err) {
      console.error('Error cargando servicios asignados', err);
      // 👇 evitar que se queden seleccionados viejos si la carga falla
      this.assignedServices = [];
      this.serviciosSeleccionadosExtras = [];
    }
  }

  // Ids de los servicios ya asignados (helper)
  get assignedServiceIds(): number[] {
    return this.assignedServices.map(s => Number(s.id));
  }

  // Enviar al backend los cambios en los servicios extras (agregar y quitar)
  async applySelectedExtras(): Promise<void> {
    if (!this.estudianteUnidadId) {
      this.alertasService.mostrarError('No existe asignación para la unidad', 'Error');
      return;
    }

    // ids de servicios EXTRA actualmente asignados (no base)
    const assignedExtrasIds = this.assignedServices
      .filter((s: any) => !s.es_base)
      .map((s: any) => Number(s.id));

    // los que el usuario seleccionó en la UI
    const selectedIds = this.serviciosSeleccionadosExtras.map(Number);

    // nuevos a agregar = seleccionados que antes no estaban
    const toAdd = selectedIds.filter(id => !assignedExtrasIds.includes(id));

    // a quitar = asignados antes pero que ya NO están seleccionados
    const toRemove = assignedExtrasIds.filter(id => !selectedIds.includes(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      this.alertasService.mostrarAdvertencia('No hay cambios en los servicios extras');
      return;
    }

    this.isProcessingExtras = true;
    try {
      // 1) Agregar nuevos
      for (const sid of toAdd) {
        await firstValueFrom(
          this.serviciosService.agregarServicioAAsignacion(this.estudianteUnidadId, sid)
        );
      }

      // 2) Eliminar los que se quitaron
      for (const sid of toRemove) {
        await firstValueFrom(
          this.serviciosService.eliminarServicioDeAsignacion(this.estudianteUnidadId, sid)
        );
      }

      // 3) Recargar servicios asignados y sincronizar selección
      await this.loadAssignedServices();
      this.alertasService.mostrarExito('Servicios actualizados correctamente');
    } catch (err) {
      console.error('Error al actualizar servicios', err);
      this.alertasService.manejarErrores(err, 'actualizar servicios');
    } finally {
      this.isProcessingExtras = false;
    }
  }

}
