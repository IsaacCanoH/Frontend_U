import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EstudianteRoutingModule } from './estudiante-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { PropiedadDetalleComponent } from './pages/propiedad-detalle/propiedad-detalle.component';
import { RegistroEstudianteComponent } from './pages/registro-estudiante/registro-estudiante.component';
import { MapaDetalleComponent } from '../../shared/componentes/mapas/mapa-detalle/mapa-detalle.component';
import { MapaBusquedaComponent } from '../../shared/componentes/mapas/mapa-busqueda/mapa-busqueda.component';
import { MisUnidadesComponent } from './pages/mis-unidades/mis-unidades.component';
import { UnidadDetalleComponent } from './pages/unidad-detalle/unidad-detalle.component';

@NgModule({
  declarations: [
    HomeComponent,
    PropiedadDetalleComponent,
    RegistroEstudianteComponent,
    MapaDetalleComponent,
    MapaBusquedaComponent,
    MisUnidadesComponent,
    UnidadDetalleComponent
  ],
  imports: [
    CommonModule,
    EstudianteRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EstudianteModule { }
