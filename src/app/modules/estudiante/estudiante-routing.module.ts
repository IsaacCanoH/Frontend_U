import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { PropiedadDetalleComponent } from './pages/propiedad-detalle/propiedad-detalle.component';
import { RegistroEstudianteComponent } from './pages/registro-estudiante/registro-estudiante.component';
import { MisUnidadesComponent } from './pages/mis-unidades/mis-unidades.component';
import { UnidadDetalleComponent } from './pages/unidad-detalle/unidad-detalle.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'registro', component: RegistroEstudianteComponent },
  { path: 'propiedad/:id', component: PropiedadDetalleComponent },
  { path: 'mis-unidades', component: MisUnidadesComponent },
  { path: 'mis-unidades/:id', component: UnidadDetalleComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstudianteRoutingModule { }
