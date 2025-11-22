import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-procesamiento-documento',
  templateUrl: './procesamiento-documento.component.html',
  styleUrls: ['./procesamiento-documento.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcesamientoDocumentoComponent {
  @Input() mensaje: string = 'Procesando documento';
  @Input() visible: boolean = false;
  @Input() previewUrl: string | null = null;
  @Input() fileType: string | null = null;

  get esImagen(): boolean {
    return !!this.fileType?.startsWith('image/');
  }
}