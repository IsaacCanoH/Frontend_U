import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroRenteroComponent } from './pages/registro-rentero/registro-rentero.component';
import { RenteroLayoutComponent } from './pages/rentero-layout/rentero-layout.component';
import { FormularioPropiedadComponent } from './components/formulario-propiedad/formulario-propiedad.component';
import { FormularioUnidadComponent } from './components/formulario-unidad/formulario-unidad.component';

const routes: Routes = [
  { path: '', component: RenteroLayoutComponent },
  { path: 'registro', component: RegistroRenteroComponent },

  // === FORMULARIO UNIVERSAL (propiedades y unidades) ===
  { path: 'propiedades/:propiedadId/nueva-unidad', component: FormularioUnidadComponent },  // Nueva unidad
  { path: 'unidades/:unidadId/editar', component: FormularioUnidadComponent },  // Editar unidad
  // === RUTAS DE PROPIEDADES ===
  { path: 'formulario', component: FormularioPropiedadComponent },  // Nueva propiedad
  { path: 'formulario/:id', component: FormularioPropiedadComponent },  // Editar propiedad
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RenteroRoutingModule { }
