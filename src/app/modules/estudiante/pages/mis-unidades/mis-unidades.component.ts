import { Component, OnInit } from '@angular/core';
import { EstudianteService } from '../../../../core/services/estudiante.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-unidades',
  templateUrl: './mis-unidades.component.html',
  styleUrls: ['./mis-unidades.component.scss']
})
export class MisUnidadesComponent implements OnInit {
  unidades: any[] = [];
  cargando = false;

  constructor(private estudianteService: EstudianteService, private router: Router) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.estudianteService.obtenerMisUnidades().subscribe({
      next: res => { this.unidades = res.data || []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  verDetalle(unidadId: number) {
    this.router.navigate(['/estudiante/mis-unidades', unidadId]);
  }
}
