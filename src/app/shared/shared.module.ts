import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcesamientoDocumentoComponent } from './componentes/procesamiento-documento/procesamiento-documento.component';

@NgModule({
  declarations: [ProcesamientoDocumentoComponent],
  imports: [CommonModule],
  exports: [ProcesamientoDocumentoComponent]
})
export class SharedModule {}
