import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginRenteroComponent } from './modules/rentero/pages/login-rentero/login-rentero.component';

const routes: Routes = [
  { path: 'login', component: LoginRenteroComponent },
  { path: 'estudiante',
    loadChildren: () => import('./modules/estudiante/estudiante.module').then(m => m.EstudianteModule)
  },
  { path: 'rentero',
    loadChildren: () => import('./modules/rentero/rentero.module').then(m => m.RenteroModule)
  },

  { path: '', redirectTo: '/estudiante', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
