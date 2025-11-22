import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EstudianteRoutingModule } from './estudiante-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { PropiedadDetalleComponent } from './pages/propiedad-detalle/propiedad-detalle.component';
import { MapaDetalleComponent } from '../../shared/componentes/mapas/mapa-detalle/mapa-detalle.component';
import { MapaBusquedaComponent } from '../../shared/componentes/mapas/mapa-busqueda/mapa-busqueda.component';

@NgModule({
  declarations: [
    HomeComponent,
    PropiedadDetalleComponent,
    MapaDetalleComponent,
    MapaBusquedaComponent
  ],
  imports: [
    CommonModule,
    EstudianteRoutingModule,
    FormsModule
  ]
})
export class EstudianteModule { }
