class MyHeader extends HTMLElement {
  connectedCallback() { 
    this.innerHTML = `
<header id="header" class="page-topbar">
  <!-- 1. BARRA SUPERIOR (NAVBAR) -->
  <nav class="nav-extended">
    <div class="row valign-wrapper" style="margin-bottom: 0; min-height: 56px;">
      <div class="col s2 m1 l1" style="display: flex; align-items: center;">
        <a href="#" data-target="mobile-demo" class="sidenav-trigger" style="display: block !important; margin: 0;">
          <i class="material-icons" style="color: #ffffff; font-size: 28px;">menu</i>
        </a>
      </div>
      <div class="col s8 m10 l10 center-align">
        <a href="home.html" class="brand-logo" style="position: static; transform: none;"></a>
      </div>
      <div class="col s2 m1 l1"></div>
    </div>
  </nav>

  <!-- 2. CONTENEDOR BUSCADOR UNIFICADO -->
  <div class="contenedor-buscador">
    <div class="buscador-unified-wrapper">
      <div class="buscador-unified-input-box">
        <input class="uil uil-search-alt custom-search-input" data-role="none" id="articulo" placeholder="Buscar artículo o referencia..." value="" autocomplete="off">
        <button id="buscado" class="btn-search-unified" type="button" onclick="javascript: preBusqueda()">
          <i class="material-icons">search</i>
        </button>
      </div>

      <a href="#" onclick="filtrosModal();" class="btn-filter-unified" title="Filtros avanzados">
        <i class="material-icons">filter_list</i>
      </a>
    </div>

    <!-- Checkbox Sin Existencias -->
    <div class="buscador-options-row">    
      <label class="check-sin-existencias-label">
        <input type="checkbox" id="sinExistencias" />
        <span>Mostrar búsqueda sin existencias</span>
      </label>            
    </div>
  </div>

  <!-- 3. BARRA DE SUCURSAL / UBICACIÓN -->
  <div class="row shop-bodegas">
    <a href="javascript:void(0);">
      <div class="col location">
        <div class="img">
          <img src="img/icon/location.svg?SDdd" alt="Ubicación">
        </div>
      </div>
      <div class="col s9">
        <h6 id="bodega-sucursal">Seleccionar Sucursal</h6>
      </div>
    </a>
    <input type="hidden" id="bodega" />
    <input type="hidden" id="txtCategoria" />
  </div>

  <!-- 4. MODAL DE BODEGAS -->
  <div id="bodega_sucursales" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="close-modal">
          <a href="#!" class="modal-close waves-effect waves-green btn-flat green-text">
            <span class="text">CERRAR</span>
            <span class="material-symbols-outlined right">close</span>
          </a>
        </div>
      </div>
      <h5 class="left-align" style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">Seleccionar Bodega O Sucursal</h5>
      <div id="carga_more_sucursales"></div>
    </div>
  </div>

  <!-- 5. MENU LATERAL IZQUIERDO (SIDENAV) -->
  <div class="sidenav" id="mobile-demo">
    <div class="row bordered" style="padding: 15px 10px; margin-bottom: 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div class="col s7" style="display: flex; align-items: center; gap: 8px;">
        <a href="home.html">
          <img src="img/Logo2.png" class="img-circle profile_img" style="width: 48px; height: 48px; margin: 0;">
        </a>
        <span id="usuario" style="color: #ffffff; font-weight: 600; font-size: 13px;">Usuario</span>
        <input type="hidden" id="hUsuario" />
      </div>
      <div class="col s5 right-align" style="padding-top: 8px;">
        <a href="#" onclick="logout();" class="btn-logout-link">
          <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">power_off</span>
          <span style="font-size: 12px; font-weight: 600;">Salir</span>
        </a>
      </div>
    </div>
    <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
  </div>

  <!-- 6. PANTALLA FILTRO MODAL -->
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
//   connectedCallback() { 
//     this.innerHTML = `
// <header id="header" class="page-topbar">
//     <!-- encabezado logo-->
//     <nav class="nav-extended">
//       <div class="row valign-wrapper" style="margin-bottom: 0; min-height: 56px;">
//         <div class="col s2 m1 l1" style="display: flex; align-items: center;">
//           <a href="#" data-target="mobile-demo" class="sidenav-trigger" style="display: block !important; margin: 0;">
//             <i class="material-icons" style="color: #ffffff; font-size: 28px;">menu</i>
//           </a>
//         </div>
//         <div class="col s8 m10 l10 center-align">
//           <a href="home.html" class="brand-logo" style="position: static; transform: none;"></a>
//         </div>
//         <div class="col s2 m1 l1"></div>
//       </div>
//     </nav>
//     <!-- encabezado logo-->

//      <!--BUSCADOR-->
//      <div class="contenedor-buscador">
//               <div class="row">
//                 <div class="col s11">
//                   <div class="row buscador">
//                     <div class="s10 col">
//                       <input class="uil uil-search-alt" data-role="none" id="articulo" placeholder="Buscar" value=""
//                         autocomplete="off">
//                     </div>
//                     <div class="s2 col">                      
//                       <button id="buscado" class="search-action ui-btn" onclick="javascript: preBusqueda()">
//                         <i class="material-icons">search</i>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//                 <div class="col s1" style="padding-left: 0;">
//                   <a href="#" onclick="filtrosModal();"><span class=" btn-Filtros-Clase material-symbols-outlined text-black"><i class="material-icons">filter_list</i></span></a>
//                 </div>                
//               </div>
//                <div >    
//                 <label style="margin-left: 40px; color:#fafafa;">
//                       <input type="checkbox" id="sinExistencias" />
//                       <span>Mostrar busqueda sin existencias </span>
//                     </label>            
//               </div>
//             </div>
//             <!--FIN BUSCADOR-->

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

//     <!--  MODAL DE LAS BODEGAS  -->
//     <div id="bodega_sucursales" class="modal">
//       <div class="modal-content">
//         <div class="modal-header">
//           <div class="close-modal">
//             <a href="#!" class="modal-close waves-effect waves-green btn-flat green-text">
//               <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
//           </div>
//         </div>
//         <h5 class="left-align">Seleccionar Bodega O Sucursal</h5>
//         <!-- AQUI SE CARGAN LA DATA DE LAS BODEGAS -->
//         <div id="carga_more_sucursales"></div>
//       </div>
//     </div>
//     <!-- FIN MODAL DE LAS BODEGAS -->

//     <!-- MENU LATERAL IZQUIERDO -->
//     <div class="sidenav" id="mobile-demo">
//       <div class="row bordered">
//         <div class="col s6 m6" style="display: flex; align-items: center;">
//           <a href="home.html">
//           <img src="img/Logo2.png" class="img-circle profile_img" style="max-width: 74%; height: auto;margin-right: 10px;">
//           </a>
//           <span id="usuario" class="hide-on-med-and-downx" style="color: #000;">Contenido del span</span>
//           <input type="hidden" id="hUsuario" />
//         </div>
//         <div class="col s6 m6">
//           <div class="close-session">
//             <a href="#" onclick="logout();" class="green-text"><span class="material-symbols-outlined green-text right"
//                 style="margin-right: 0px;">power_off</span><span class="textclose-sesion">Cerrar sesión</span></a>
//           </div>
//         </div>
//       </div>
//       <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
//     </div>
//     <!-- FIN MENU LATERAL IZQUIERDO -->

//     <!--PANTALLA FILTRO MODAL-->
//     <div id="modalFiltro" class="modal">
//       <div class="modal-header">
//         <div class="row bordered">
//           <div class="col s8">
//           </div>
//           <div class="col s4">
//             <div class="close-modal">
//               <a onclick="cerrarModal()" class="modal-close waves-effect waves-green btn-flat green-text">
//                 <span class="text">CERRAR</span><span class="material-symbols-outlined right">close</span></a>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div class="modal-content">
//         <div id="divFiltro">
//         </div>
//       </div>
//     </div>
//     <!--FIN PANTALLA FILTRO MODAL-->
//   </header>
// `;
//   }
// }
// customElements.define("my-header", MyHeader);
