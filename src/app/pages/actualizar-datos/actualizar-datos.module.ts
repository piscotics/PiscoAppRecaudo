import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ActualizarDatosPage } from './actualizar-datos.page';
import { OwnComponentsModule } from 'src/app/own-components/own-components.module';

const routes: Routes = [
  {
    path: '',
    component: ActualizarDatosPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule ,
    IonicModule,

    RouterModule.forChild(routes),
    OwnComponentsModule
  ],
  declarations: [ActualizarDatosPage],
  entryComponents:[ActualizarDatosPage]

})
export class ActualizarDatosPageModule {}
