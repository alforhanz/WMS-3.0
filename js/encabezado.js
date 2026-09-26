/**
 * js/encabezado.js
 * Componente Web <my-header> con selector de bodega SweetAlert2 y Logout blindado.
 */

// Garantizar que logout esté disponible globalmente sin depender del orden de scripts
window.logout = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // 1. Limpiar variables de sesión y datos operativos
  sessionStorage.clear();

  // Conservar únicamente las credenciales guardadas si el usuario seleccionó "Recordar"
  const keysConservar = ["username", "password", "checkbox", "wms_app_version"];
  Object.keys(localStorage).forEach(function (key) {
    if (!keysConservar.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // 2. Limpiar cookies de sesión si existieran
  document.cookie.split(";").forEach(function (c) {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // 3. Redirección inmediata a index.html (Login) rompiendo caché
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

      <a href="javascript:void(0);" onclick="filtrosModal();" class="btn-filter-unified" title="Filtros avanzados">
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

  <!-- 3. BARRA DE SUCURSAL / UBICACIÓN (Alineados juntos a la izquierda) -->
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

  <!-- 4. MENU LATERAL IZQUIERDO (SIDENAV) -->
  <div class="sidenav" id="mobile-demo">
    <div class="row bordered" style="padding: 14px 12px; margin-bottom: 0; border-bottom: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: space-between;">
      
      <!-- Usuario Activo -->
      <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
        <a href="home.html">
          <img src="img/Logo2.png" class="img-circle profile_img" style="width: 42px; height: 42px; margin: 0;" onerror="this.style.display='none'">
        </a>
        <span id="usuario" style="color: #ffffff; font-weight: 600; font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Usuario</span>
        <input type="hidden" id="hUsuario" />
      </div>

      <!-- Botón Salir / Cerrar Sesión -->
      <div>
        <a href="javascript:void(0);" onclick="logout(event);" class="btn-logout-link" title="Cerrar sesión">
          <span class="material-symbols-outlined" style="font-size: 20px;">power_off</span>
          <span>Salir</span>
        </a>
      </div>
    </div>

    <!-- Menú Dinámico -->
    <ul class="collapsible" id="MenuL" style="font-size: 13px;"></ul>
  </div>

  <!-- 5. PANTALLA FILTRO MODAL -->
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