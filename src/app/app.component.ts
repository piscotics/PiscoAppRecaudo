import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform, MenuController, AlertController, ToastController, LoadingController, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';



// Modelos
import { SesionLocalModel } from './models/sesion-local.model';

// Servicios
import { ConfiguracionService } from 'src/app/services/configuracion.service';
import { SesionService } from './services/sesion.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { PrintService } from './services/print.service';
import { SQLite , SQLiteObject  } from '@ionic-native/sqlite/ngx';
import { OfflineService } from './services/offline.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigHelper } from './helpers/config.helper';
import { CuadreCajaRequesModel } from './models/cuadre-caja.model';
import { ConsultarRutaRequesModel } from "./models/consultar-ruta.model";
import { Device } from '@ionic-native/device/ngx';
import { RegistrarpagoModel } from './models/registrar-pago.model';
import { RegistroGestionModel } from './models/registro-gestion.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

  backButtonSubscription: Subscription;
  mostrandoConfirmacionCerrarApp: boolean = false;
  msg : string ='';
  sesionLocal: SesionLocalModel = new SesionLocalModel();
  menuPrincipalId: string = 'menuPrincipal';
  license: string = '';

  statusOffline: boolean;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private menu: MenuController,
    private alertController: AlertController,
    private configService: ConfiguracionService,
    private sesionService: SesionService,
    private androidPermissions: AndroidPermissions,
    private print: PrintService,
    private configuracionService: ConfiguracionService,
    private toastController: ToastController,
    private alert: AlertController,
    private sqlite: SQLite,
    private device: Device,
    private ofline: OfflineService,
    private loading: LoadingController,
    private http: HttpClient,
    private navCtrl: NavController
  ) {
    this.initializeApp();
    this.statusOffline = localStorage.getItem('offlineMode') === 'true' ? true : false;
    this.msg = localStorage.getItem('existeRuta')

    this.router.events.subscribe(event=>{
      if(event instanceof NavigationEnd){
        try{
          if(event.url === '/login') {
            this.menu.enable(false, this.menuPrincipalId);
          }
          else {
            this.menu.enable(true, this.menuPrincipalId);
          }
        } catch(ex){
          console.log(ex);
        }
      }
    })
  }

  ngOnInit(): void {
    this.backButtonSubscription = this.platform.backButton.subscribe(() => {

      if (!this.mostrandoConfirmacionCerrarApp && (this.router.url.startsWith('/home') || this.router.url.startsWith('/login'))) {
        this.mostrandoConfirmacionCerrarApp = true;
        this.mostrarConfirmacionCerrarApp();
      }
      
    });
  }

  ngOnDestroy(): void {
    this.backButtonSubscription.unsubscribe();
  }

  async mostrarConfirmacionCerrarApp() {
    const alert = await this.alertController.create({
      header: 'Confirmaci??n',
      message: '??Quieres salir de la aplicaci??n?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            alert.dismiss();
            this.mostrandoConfirmacionCerrarApp = false;
          }
        }, {
          text: 'Si',
          handler: () => {
            navigator['app'].exitApp();
          }
        }
      ]
    });

    await alert.present();
  }
  consultarRuta(){
    this.router.navigate(['consultar-ruta']);
    this.menu.close(this.menuPrincipalId);
    
  }

  initializeApp() {
    this.platform.ready().then(() => {
      
      //this.menu.close(this.menuPrincipalId);
      // Cargamos la configuraci??n y el estado de la sesi??n
      Promise.all([
        this.configService.obtenerConfiguracion(),
        this.sesionService.obtenerSesionLocal()
      ]).then(() => {

        this.sesionLocal = this.sesionService.sesionLocal;

        if (this.platform.is('ios')) {
          this.statusBar.overlaysWebView(true);
        }
        this.license = this.device.uuid;
        if(this.platform.is('android')){
          
          this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH).then(res=>{
          }, err=>{
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.BLUETOOTH).then(res=>{
            }, err=>{
            });
          });

          this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.INTERNET).then(res=>{}).catch(err=>{
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET).then(res=>{}).catch(err=>{})
          });
        }

        // this.statusBar.styleDefault();
        
        this.statusBar.backgroundColorByName('lightGray');
        this.splashScreen.hide();
        // this.createDatabase();
      });

    });
  }

  mostrarMenu() {
    //this.statusOffline = localStorage.getItem('offlineMode') === 'true' ? true : false;
    return !this.router.url.startsWith('/login') && !this.router.url.startsWith('/config');
  }

  consultarContrato() {
    this.router.navigate(['consultar-contrato']);
    this.menu.close(this.menuPrincipalId);
  }

  consultarPago() {
    this.router.navigate(['consultar-pago']);
    this.menu.close(this.menuPrincipalId);
  }

  cuadreCaja() {
    this.router.navigate(['cuadre-caja']);
    this.menu.close(this.menuPrincipalId);
  }


  removerLicencia() {

    console.log("se removera la licencia")
    this.alertController.create({
      header: 'Eliminar Licencia',
     message: 'Esta Seguro De Eliminar La Licencia, ??Desea continuar?',
     buttons:[
       { 
         text: 'Si', role: 'accept', handler: ()=>{
          
               this.sesionService.removerLicencia();
           this.sesionService.cerrarSesion();
           this.router.navigate(['']);
         }
       },
       { 
         text: 'No', role: 'cancel', handler: ()=>{ 
           this.alertController.dismiss();
         }
       }
     ]
   }).then(a=>{
     a.present();
   })
  }

  geolicalizacion() {
    alert('Debe ir a la pantalla de golocalizaci??n (Pendiente)');
  }

  configurarImpresora() {
    /**
     * Se genera l??gica para consulta de dispositivos bluetooth.
     */

    this.print.searchBt().then(res=>{
      let inputs = [];
      for(let item of res){
        inputs.push({
          name: item.address,
          type: 'radio',
          value: item.address,
          label: item.name
        });
      }

      let modalPrint;
      this.alert.create({
        header: 'Dispositivos',
        inputs: inputs,
        buttons:[
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass:'secondary'
          },
          {
            text: 'Aceptar',
            handler: data=>{
              this.configuracionService.guardarImpresora(data).then(res=>{
                this.toastController.create({
                  message: 'Impresora configurada satisfactoriamente',
                  duration: 2000
                }).then(res=>{
                  res.present();
                })
              }).catch(err=>{
                  this.toastController.create({ message: err.message, duration: 2000}).then(obj=>{ obj.present()});
              })
            }
          }
        ]
      }).then(res=>{
        modalPrint = res;
        res.present();
      });
    }).catch(err=>{
      this.alert.create({
        header: 'Error',
        message: 'Se ha presentado un error al conectarnos con sus dispositivos Bluetooth, por favor revise su conexi??n',
        buttons: ['Ok']
      }).then((res)=>{
        res.present();
      })
    })
  }

  cerrarSesion() {
    this.menu.close(this.menuPrincipalId);
    this.sesionService.cerrarSesion();
    // this.router.navigate(['/login']);
        // this.router.navigate(['login'], { replaceUrl: true });
  }


  private createDatabase()
  {
    this.sqlite.create({
      name: 'developers.db',
      location: 'default'
    })
    .then((db: SQLiteObject) => {
      console.log("db creada");
    })
    .catch(e => console.log(e));
  
  }

  GetRest(url): Promise<any>{
    return new Promise((resolve, reject)=>{
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      };
 
      let configHelper = new ConfigHelper(this.configuracionService.config);
      this.http.get(`${configHelper.getApiUrl()}${url}`).subscribe(res=>{
        resolve(res);
      }, err=>{
        reject(err);
      });
    });
 }

  GetRestBody(url, body): Promise<any>{

    
    return new Promise((resolve, reject)=>{
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      };

      let configHelper = new ConfigHelper(this.configuracionService.config);
      console.log(JSON.stringify(body))
      this.http.post(`${configHelper.getApiUrl()}${url}`, body,  httpOptions ).subscribe(res=>{
        resolve(res);
      }, err=>{
        reject(err);
      });
    });
  }

  
  async SincronizeData(){
    
    const dataPost = new CuadreCajaRequesModel(this.sesionLocal.sesionUsuario.IDCOBRADOR, null);

    let l = await this.loading.create({
      message: 'Cargando Pagos/Novedades Locales',
      backdropDismiss: false
    });


    try
    {
      await l.present();
      
      

      l.message = "Creando Base de Datos";

      await this.ofline.createDatabase();

      l.message = "Creando Tablas Locales";

      await this.ofline.createTables();

      l.message = "Cargando Licencias";

      let data = await this.GetRest('/login/licenceslocale');

      await this.ofline.sincronizarLicencias(data);


      l.message = "Cargando Usuarios";

      data = await this.GetRest('/login/userlocale');

      await this.ofline.sincronizarUsuarios(data);


      //await this.ofline.loginOffline("1005", "1005");

      l.message = "Cargando Informacion Empresa";

      data = await this.GetRest('/pago/funeraria');

      await this.ofline.sincronizarEmpresas(data);

      l.dismiss();
      
      alert('Modo Fuera De Linea Exitoso'); 
      
      

    }catch(ex)
    {
      alert(ex.message);
      l.dismiss();
    }
    
  }

  //metodo para sincronizar las rutas de la bd 
  async cargarRuta(){

    const dataPost = new CuadreCajaRequesModel(this.sesionLocal.sesionUsuario.IDCOBRADOR, null);

    let l = await this.loading.create({
      message: 'Cargando Rutas',
      backdropDismiss: false
    });

    try
    {
      this.msg ='Ruta cargada satisfactoriamente';

      await l.present();

      //sincroniza las rutas
      l.message = "Creando Base de Datos";

      await this.ofline.createDatabase();

      l.message = "Creando Tabla De Rutas";

      await this.ofline.createTablesRutas();
      
      //************************************************* */

      l.message = "Creando Tabla Pagos/Novedades";

      await this.ofline.createTablesPgosNovedad();

     //sincronizamos  tipo novedad 
     
      l.message = 'Cargando Tipos Novedades';

      let data = await this.GetRest('/contrato/tipoNovedad');

      await this.ofline.SincronizarListaNovedades(data);

     //*********************************************************** */
      
      l.message = 'Cargando Rutas';

      data = await this.GetRestBody('/posicion/lstRutas', dataPost);


      console.log("los datos de la ruta ", data)

      if (data == '')
      {
        this.msg = 'Ruta No Encontrada';
      }else{
        localStorage.setItem('existeRuta', 'Ruta cargada satisfactoriamente');
      }
      

      await this.ofline.sincronizarRutas(data) ;

      l.dismiss();

      //sincroniza las formas de pago 

      l.message = "Cargando Formas de Pago";

      data = await this.GetRest('/pago/TiposPagos');

      await this.ofline.sincronizarFormaPago(data);

      l.dismiss();
      
      alert(this.msg); 

    }catch(ex)
    {
      alert(ex.message);
      l.dismiss();
    }

  }

  //metodo para sincronizar las novedades y los pagos 
  async sincronizar(){
    let l = await this.loading.create({
      message: 'Sincronizando Novedades Y Pagos',
      backdropDismiss: false
    });

    try
    {
      await l.present();

      // sincroniza los pagos

      l.message = 'Sincronizando Pagos';

      await this.CargarPagosBdLocal();

      l.dismiss();
      
      alert('Informac??on sincronizada satisfactoriamente'); 

    }catch(ex)
    {
      alert(ex.message);
      l.dismiss();
    }

  }

  async CargarPagosBdLocal(){
    this.ofline.getListapago().then((datapagos: RegistrarpagoModel[]) => {
      if(datapagos.length> 0){
          for (var _i = 0; _i < datapagos.length; _i++) 
          {
            var item = datapagos[_i];
            this.GetRestBody('/pago/create', item);
          }
      }
    });

    this.ofline.getListaNovedades().then((datanovedad: any[]) => {
      if(datanovedad.length> 0){
        for (var _j = 0; _j < datanovedad.length; _j++) 
        {
          let gestiondata = new  RegistroGestionModel();
          var itemnovedad = datanovedad[_j];
          gestiondata.Contrato = itemnovedad.CONTRATO;
          gestiondata.Novedad = itemnovedad.NOVEDAD;
          gestiondata.Diapos = itemnovedad.DIAPOST;
          gestiondata.Usuario = itemnovedad.USUARIO;
          gestiondata.IdCobrador = itemnovedad.IDCOBRADOR;
          gestiondata.Modulo = itemnovedad.MODULO;
          gestiondata.Transac = itemnovedad.TRANSAC;
          gestiondata.Fechaprogramada = itemnovedad.FECHAPROGRAMADA;
          gestiondata.Posx = itemnovedad.POSX;
          gestiondata.Posy = itemnovedad.POSY;
          gestiondata.Observaciones = itemnovedad.OBSERVACIONES;
          this.GetRestBody('/pago/insertNove', gestiondata);
        }
        
      }
  });
  }

  offlineChange(){
    this.alertController.create({
      header: 'Trabajo Fuera de Linea',
      message: !this.statusOffline ? 'Si desactiva el modo "Trabajo Fuera de Linea" la aplicaci??n no tendr?? en cuenta la informaci??n local, ??Desea continuar?': 'Si activa el modo "Trabajo Fuera de Linea" debe cargar una ruta, ??Desea continuar?',
      buttons:[
        { 
          text: 'Si', role: 'accept', handler: ()=>{
            if(this.statusOffline)
            {
              this.SincronizeData().then(res=>{
  
              }).catch(err=>{
                this.statusOffline = !this.statusOffline;
              });
            }
            localStorage.setItem('offlineMode', this.statusOffline ? 'true' : 'false');
            localStorage.setItem('existeRuta', 'Ruta cargada satisfactoriamente');

          }
        },
        {
         
          text: 'No', role: 'cancel', handler: ()=>{ 
            this.statusOffline = false;
            this.alertController.dismiss();
          }
        }
      ]
    }).then(a=>{
      a.present();
    })
  }

  // utiiza el metodo sincronico para cargar rutas
  offlineCargarRutas(){
    this.alertController.create({
      header: 'Cargar Ruta',
      message: 'Esta Seguro De Cargar La Ruta, ??Desea continuar?',
      buttons:[
        { 
          text: 'Si', role: 'accept', handler: ()=>{
           
              this.cargarRuta().then(res=>{
  
              }).catch(err=>{
                
              });
          }
        },
        { 
          text: 'No', role: 'cancel', handler: ()=>{ 
            this.alertController.dismiss();
          }
        }
      ]
    }).then(a=>{
      a.present();
    })
  }

  // utiiza el metodo sincronico para cargar pagos y novedades
  offlineCargarPagosNovedades(){
    this.alertController.create({
      header: 'Sincronizar Rutas',
      message: 'Esta Seguro Que Desea Sincronizar Los Pagos Y Novedades, ??Desea continuar?',
      buttons:[
        { 
          text: 'Si', role: 'accept', handler: ()=>{
           
              this.sincronizar().then(res=>{
  
              }).catch(err=>{
                
              });
          }
        },
        { 
          text: 'No', role: 'cancel', handler: ()=>{ 
            this.alertController.dismiss();
          }
        }
      ]
    }).then(a=>{
      a.present();
    })
  }
}
