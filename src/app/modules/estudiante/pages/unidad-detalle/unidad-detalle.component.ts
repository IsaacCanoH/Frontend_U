import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EstudianteService } from '../../../../core/services/estudiante.service';

@Component({
  selector: 'app-unidad-detalle',
  templateUrl: './unidad-detalle.component.html',
  styleUrl: './unidad-detalle.component.scss'
})
export class UnidadDetalleComponent implements OnInit {
  unidad: any = null;
  cargando = false;

  constructor(private route: ActivatedRoute, private estudianteService: EstudianteService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    if (id) this.cargar(id);
  }

  cargar(id: number) {
    this.cargando = true;
    this.estudianteService.obtenerUnidadAsignada(id).subscribe({
      next: res => { this.unidad = res.data; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  get serviciosBase(): any[] {
  const lista = this.unidad?.descripcion?.servicios || [];
  return lista
    .map((s: any) => (typeof s === 'object' ? s : { nombre: s }))
    .filter((s: any) => !!s && s.es_base === true);
}
}