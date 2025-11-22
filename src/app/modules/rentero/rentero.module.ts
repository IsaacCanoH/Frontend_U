import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RenteroRoutingModule } from './rentero-routing.module';
import { FormularioUnidadComponent } from './components/formulario-unidad/formulario-unidad.component';
import { RenteroLayoutComponent } from './pages/rentero-layout/rentero-layout.component';
import { RegistroRenteroComponent } from './pages/registro-rentero/registro-rentero.component';
import { FormularioPropiedadComponent } from './components/formulario-propiedad/formulario-propiedad.component';
import { LoginRenteroComponent } from './pages/login-rentero/login-rentero.component';
import { SharedModule } from '../../shared/shared.module';
import { MapaSeleccionComponent } from '../../shared/componentes/mapas/mapa-seleccion/mapa-seleccion.component';

@NgModule({
  declarations: [
    RenteroLayoutComponent,
    RegistroRenteroComponent,
    FormularioPropiedadComponent,
    LoginRenteroComponent,
    MapaSeleccionComponent,
    FormularioUnidadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RenteroRoutingModule
  ]
})
export class RenteroModule { }
