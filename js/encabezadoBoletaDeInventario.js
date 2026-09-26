/**
 * js/encabezadoBoletaDeInventario.js
 * Encabezado estándar para Creación de Boleta de Inventario (sin buscador global).
 */

window.logout = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  sessionStorage.clear();
  const keysConservar = ["username", "password", "checkbox", "wms_app_version"];
  Object.keys(localStorage).forEach(function (key) {
    if (!keysConservar.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  document.cookie.split(";").forEach(function (c) {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  window.location.replace("index.html?nocache=" + new Date().getTime());
};

class MyHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<header id="header" class="page-topbar">
  <!-- 1. BARRA SUPERIOR (NAVBAR) -->
  <nav class="nav-extended">
    <div class="row valign-wrapper" style="margin-bottom: 0; min-height: 56px;">
      <div class="col s2 m1 l1" style="display: flex; align-items: center;">
        <a href="javascript:void(0);" data-target="mobile-demo" class="sidenav-trigger" style="display: block !important; margin: 0;" title="Abrir Menú">
          <i class="material-icons" style="color: #ffffff; font-size: 28px;">menu</i>
        </a>
      </div>
      <div class="col s8 m10 l10 center-align">
        <span style="color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Creación de Boleta de Inventario
        </span>
      </div>
      <div class="col s2 m1 l1 right-align" style="padding-right: 15px;">
        <a href="dash1.html" style="color: #ffffff; display: inline-flex; align-items: center;" title="Inicio">
          <i class="material-icons" style="font-size: 24px;">home</i>
        </a>
      </div>
    </div>
  </nav>

  <!-- 2. BARRA DE SUCURSAL / UBICACIÓN -->
  <div class="shop-bodegas">
    <a href="javascript:void(0);" class="bodega-trigger-link" onclick="abrirSelectorBodegas();" title="Cambiar bodega o sucursal activa">
      <div class="location-icon">
        <img src="img/icon/location.svg?SDdd" alt="Ubicación">
      </div>
      <h6 id="bodega-sucursal">Seleccionar Sucursal</h6>
      <i class="material-icons" style="font-size: 16px; color: #cbd5e1; margin-left: 2px;">arrow_drop_down</i>
    </a>
    <input type="hidden" id="bodega" />
    <input type="hidden" id="txtCategoria" />
  </div>

  <!-- 3. MENU LATERAL IZQUIERDO (SIDENAV) -->
  <div class="sidenav" id="mobile-demo">
    <div class="row bordered" style="padding: 14px 12px; margin-bottom: 0; border-bottom: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
        <a href="dash1.html">
          <img src="img/Logo2.png" class="img-circle profile_img" style="width: 42px; height: 42px; margin: 0;" onerror="this.style.display='none'">
        </a>
        <span id="usuario" style="color: #ffffff; font-weight: 600; font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Usuario</span>
        <input type="hidden" id="hUsuario" />
      </div>

      <div>
        <a href="javascript:void(0);" onclick="logout(event);" class="btn-logout-link" title="Cerrar sesión">
          <span class="material-symbols-outlined" style="font-size: 20px;">power_off</span>
          <span>Salir</span>
        </a>
      </div>
    </div>

    <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
  </div>

  <!-- 4. PANTALLA FILTRO MODAL -->
  <div id="modalFiltro" class="modal">
    <div class="modal-header">
      <div class="row bordered" style="margin: 0; padding: 5px 10px;">
        <div class="col s8"></div>
        <div class="col s4 right-align">
          <a onclick="cerrarModal()" class="modal-close waves-effect btn-flat" style="color: #2a3f54; font-weight: bold;">
            CERRAR <i class="material-icons right">close</i>
          </a>
        </div>
      </div>
    </div>
    <div class="modal-content" style="padding: 10px 20px;">
      <div id="divFiltro"></div>
    </div>
  </div>
</header>
`;
  }
}
customElements.define("my-header", MyHeader);

//   /////////////////////////////////////////////////////////////////////
//  /////////////////////////////////////////////////////////////////////
// class MyHeader extends HTMLElement {
//     connectedCallback() {
//       this.innerHTML = `
//   <header id="header" class="page-topbar">
//       <!-- encabezado logo-->
//       <nav class="nav-extended green">
//         <div class="row">
//           <div class="s1 col">
//             <a href="#" data-target="mobile-demo" class="sidenav-trigger"><i class="material-icons">menu</i></a>
//           </div>
//           <div class="s8 col center-align">
//             <a href="dash1.html" class="brand-logo"></a>
//              <h2 style="text-align:center ; text-transform: uppercase; margin-left:2em; font-size: 20px;"><b>Creación de Boleta de Inventario</b></h2>
//           </div>
//         </div>
//       </nav>   
  
//     <!--UBICACION-->
//     <div class="row shop-bodegas">
//       <a>
//         <div class="col location">
//           <div class="img">
//             <img src="img/icon/location.svg?SDdd" alt="">
//           </div>
//         </div>
//         <div class="col s9">
//           <h6 id="bodega-sucursal">Seleccionar Sucursal</h6>
//         </div>
//       </a>
//       <input type="hidden" id="bodega" />
//       <input type="hidden" id="txtCategoria" />
//     </div>
//     <!--UBICACION-->
  
//       <!--  MODAL DE LAS BODEGAS  -->
//       <div id="bodega_sucursales" class="modal">
//         <div class="modal-content">
//           <div class="modal-header">
//             <div class="close-modal">
//               <a href="#!" class="modal-close waves-effect waves-green btn-flat green-text">
//                 <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
//             </div>
//           </div>
//           <h5 class="left-align">Seleccionar Bodega O Sucursal</h5>
//           <!-- AQUI SE CARGAN LA DATA DE LAS BODEGAS -->
//           <div id="carga_more_sucursales"></div>
//         </div>
//       </div>
//       <!-- FIN MODAL DE LAS BODEGAS -->
  
//       <!-- MENU LATERAL IZQUIERDO -->
//       <div class="sidenav" id="mobile-demo">
//         <div class="row bordered">
//           <div class="col s6 m6" style="display: flex; align-items: center;">
//             <a href="dash1.html">
//             <img src="img/Logo2.png" class="img-circle profile_img" style="max-width: 74%; height: auto;margin-right: 10px;">
//             </a>
//             <span id="usuario" class="hide-on-med-and-downx" style="color: #000;">Contenido del span</span>
//             <input type="hidden" id="hUsuario" />
//           </div>
//           <div class="col s6 m6">
//             <div class="close-session">
//               <a href="#" onclick="logout();" class="green-text"><span class="material-symbols-outlined green-text right"
//                   style="margin-right: 0px;">power_off</span><span class="textclose-sesion">Cerrar sesión</span></a>
//             </div>
//           </div>
//         </div>
//         <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
//       </div>
//       <!-- FIN MENU LATERAL IZQUIERDO -->
  
//       <!--PANTALLA FILTRO MODAL-->
//       <div id="modalFiltro" class="modal">
//         <div class="modal-header">
//           <div class="row bordered">
//             <div class="col s8">
//             </div>
//             <div class="col s4">
//               <div class="close-modal">
//                 <a onclick="cerrarModal()" class="modal-close waves-effect waves-green btn-flat green-text">
//                   <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div class="modal-content">
//           <div id="divFiltro">
//           </div>
//         </div>
//       </div>
//       <!--FIN PANTALLA FILTRO MODAL-->
//     </header>
//   `;
//     }
//   }   
//   customElements.define("my-header", MyHeader);


// /////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////
// // class MyHeader extends HTMLElement {
// //     connectedCallback() {
// //       this.innerHTML = `
// //   <header id="header" class="page-topbar">
// //       <!-- encabezado logo-->
// //       <nav class="nav-extended green">
// //         <div class="row">
// //           <div class="s1 col">
// //             <a href="#" data-target="mobile-demo" class="sidenav-trigger"><i class="material-icons">menu</i></a>
// //           </div>
// //           <div class="s8 col center-align">
// //             <a href="dash1.html" class="brand-logo"></a>
// //              <h2 style="text-align:center ; text-transform: uppercase; margin-left:2em; font-size: 25px;"><b>Creación de Boleta de Inventario</b></h2>
// //           </div>
// //         </div>
// //       </nav>   
  
// //        <!--UBICACION-->
// //     <div class="row shop-bodegas">
// //       <a>
// //         <div class="col location">
// //           <div class="img">
// //             <img src="img/icon/location.svg?SDdd" alt="">
// //           </div>
// //         </div>
// //         <div class="col s9">
// //           <h6 id="bodega-sucursal">Seleccionar Sucursal</h6>
// //         </div>
// //       </a>
// //       <input type="hidden" id="bodega" />
// //       <input type="hidden" id="txtCategoria" />
// //     </div>
// //     <!--UBICACION-->
  
// //       <!--  MODAL DE LAS BODEGAS  -->
// //       <div id="bodega_sucursales" class="modal">
// //         <div class="modal-content">
// //           <div class="modal-header">
// //             <div class="close-modal">
// //               <a href="#!" class="modal-close waves-effect waves-green btn-flat green-text">
// //                 <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
// //             </div>
// //           </div>
// //           <h5 class="left-align">Seleccionar Bodega O Sucursal</h5>
// //           <!-- AQUI SE CARGAN LA DATA DE LAS BODEGAS -->
// //           <div id="carga_more_sucursales"></div>
// //         </div>
// //       </div>
// //       <!-- FIN MODAL DE LAS BODEGAS -->
  
// //       <!-- MENU LATERAL IZQUIERDO -->
// //       <div class="sidenav" id="mobile-demo">
// //         <div class="row bordered">
// //           <div class="col s6 m6" style="display: flex; align-items: center;">
// //             <a href="dash1.html">
// //             <img src="img/Logo2.png" class="img-circle profile_img" style="max-width: 74%; height: auto;margin-right: 10px;">
// //             </a>
// //             <span id="usuario" class="hide-on-med-and-downx" style="color: #000;">Contenido del span</span>
// //             <input type="hidden" id="hUsuario" />
// //           </div>
// //           <div class="col s6 m6">
// //             <div class="close-session">
// //               <a href="#" onclick="logout();" class="green-text"><span class="material-symbols-outlined green-text right"
// //                   style="margin-right: 0px;">power_off</span><span class="textclose-sesion">Cerrar sesión</span></a>
// //             </div>
// //           </div>
// //         </div>
// //         <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
// //       </div>
// //       <!-- FIN MENU LATERAL IZQUIERDO -->
  
// //       <!--PANTALLA FILTRO MODAL-->
// //       <div id="modalFiltro" class="modal">
// //         <div class="modal-header">
// //           <div class="row bordered">
// //             <div class="col s8">
// //             </div>
// //             <div class="col s4">
// //               <div class="close-modal">
// //                 <a onclick="cerrarModal()" class="modal-close waves-effect waves-green btn-flat green-text">
// //                   <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //         <div class="modal-content">
// //           <div id="divFiltro">
// //           </div>
// //         </div>
// //       </div>
// //       <!--FIN PANTALLA FILTRO MODAL-->
// //     </header>
// //   `;
// //     }
// //   }    
// //   customElements.define("my-header", MyHeader);
  