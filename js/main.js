// =============================================================================
// CONTROL DE INSTANCIA ÚNICA (BLOQUEO DE MÚLTIPLES PESTAÑAS)
// =============================================================================
(function iniciarControlPestanaUnica() {
  const LOCK_KEY = "WMS_ACTIVE_TAB_LOCK";
  const CHANNEL_NAME = "wms_single_tab_channel";
  const HEARTBEAT_INTERVAL = 1500;
  const TIMEOUT_TOLERANCE = 3500; 

  if (!sessionStorage.getItem("WMS_TAB_ID")) {
    sessionStorage.setItem("WMS_TAB_ID", "tab_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9));
  }
  const MI_TAB_ID = sessionStorage.getItem("WMS_TAB_ID");

  let canal = null;
  if (typeof BroadcastChannel !== "undefined") {
    canal = new BroadcastChannel(CHANNEL_NAME);
  }

  let heartbeatTimer = null;
  let bloqueado = false;

  function renderizarPantallaBloqueo() {
    if (bloqueado) return;
    bloqueado = true;

    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (canal) canal.close();

    console.warn("⚠️ Pestaña duplicada detectada. Bloqueando vista...");
    try { window.stop(); } catch (e) {}

    const aplicarHtml = () => {
      document.body.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:20px; box-sizing:border-box;">
          <div style="background:#ffffff; border-radius:12px; padding:32px 24px; max-width:440px; width:100%; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #cbd5e1;">
            <div style="font-size:48px; color:#dc2626; line-height:1; margin-bottom:12px;">⚠️</div>
            <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin:0 0 10px 0;">Sesión Activa en Otra Pestaña</h2>
            <p style="font-size:13.5px; color:#64748b; line-height:1.5; margin:0 0 16px 0;">
              El sistema WMS no permite operar con múltiples pestañas simultáneas para evitar inconsistencias en parámetros de búsqueda, conteos y existencias.
            </p>
            <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px; margin-bottom:20px;">
              <span style="font-size:12px; font-weight:600; color:#991b1b;">
                Cierre esta pestaña y continúe en la ventana principal.
              </span>
            </div>
            <button type="button" onclick="window.close()" style="width:100%; height:40px; border-radius:6px; border:none; background:#1b676b; color:#ffffff; font-size:14px; font-weight:600; cursor:pointer;">
              Cerrar esta pestaña
            </button>
          </div>
        </div>
      `;
    };

    if (document.body) {
      aplicarHtml();
    } else {
      document.addEventListener("DOMContentLoaded", aplicarHtml);
    }
  }

  function actualizarHeartbeat() {
    localStorage.setItem(LOCK_KEY, JSON.stringify({
      tabId: MI_TAB_ID,
      timestamp: Date.now()
    }));
  }

  const lockDataRaw = localStorage.getItem(LOCK_KEY);
  const ahora = Date.now();

  if (lockDataRaw) {
    try {
      const lockData = JSON.parse(lockDataRaw);
      if (lockData.tabId && lockData.tabId !== MI_TAB_ID && (ahora - lockData.timestamp < TIMEOUT_TOLERANCE)) {
        renderizarPantallaBloqueo();
        return;
      }
    } catch (e) {
      localStorage.removeItem(LOCK_KEY);
    }
  }

  actualizarHeartbeat();
  heartbeatTimer = setInterval(actualizarHeartbeat, HEARTBEAT_INTERVAL);

  if (canal) {
    canal.onmessage = function (e) {
      const msg = e.data;
      if (!msg) return;

      if (msg.type === "NUEVA_PESTANA_ABIERTA" && msg.tabId !== MI_TAB_ID) {
        canal.postMessage({ type: "LIDER_PRESENTE", tabId: MI_TAB_ID });
      }

      if (msg.type === "LIDER_PRESENTE" && msg.tabId !== MI_TAB_ID) {
        const lockCheck = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}");
        if (lockCheck.tabId === msg.tabId) {
          renderizarPantallaBloqueo();
        }
      }
    };
    canal.postMessage({ type: "NUEVA_PESTANA_ABIERTA", tabId: MI_TAB_ID });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === LOCK_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data.tabId && data.tabId !== MI_TAB_ID) {
          renderizarPantallaBloqueo();
        }
      } catch (err) {}
    }
  });

  window.addEventListener("pagehide", function () {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (canal) canal.close();
  });
})();

// =============================================================================
// VARIABLES GLOBALES Y FUNCIONES BASE
// =============================================================================
var ArrayData = new Array();
var ArrayData2 = new Array();
var ArrayDataFiltrado = new Array();

var ArrayPrecio = new Array();
var promo = "";
var viewImcompletos = false;
var clearFiltros = false;
var xPag = 20;
var itemsToDelete = "";
var itemsToDelete_NoProm = "";
var promoToDelete = "";
let acumToDelete = JSON.parse(sessionStorage.getItem("itemsToDelete"));

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado...");
  cargarJsBarcode();
  validate_login();
  existeBodega();

  localStorage.setItem("sinExistencias", "false");
  const checkbox = document.getElementById("sinExistencias");
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      localStorage.setItem("sinExistencias", checkbox.checked ? "true" : "false");
    });
  }

  const elemsDate = document.querySelectorAll('.datepicker');
  if (elemsDate.length > 0) {
    M.Datepicker.init(elemsDate, {
      format: 'yyyy-mm-dd',
      autoClose: true,
      showClearBtn: true,
      defaultDate: new Date(),
      setDefaultDate: true,
      i18n: {
        cancel: 'Cancelar',
        clear: 'Limpiar',
        done: 'Ok',
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        weekdays: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        weekdaysAbbrev: ["D", "L", "M", "M", "J", "V", "S"]
      }
    });
  }
});

function cargarJsBarcode() {
  if (!document.getElementById("jsbarcode-cdn")) {
    const script = document.createElement("script");
    script.id = "jsbarcode-cdn";
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js";
    script.async = true;
    document.head.appendChild(script);
  }
}

function validate_login() {
  const user = sessionStorage.getItem("user");
  if (user) {
    const usuario = existe_Usuario();
    const userEl = document.getElementById("usuario");
    const hUserEl = document.getElementById("hUsuario");
    if (userEl) userEl.innerHTML = usuario;
    if (hUserEl) hUserEl.value = usuario;
  } else {
    window.location = "index.html";
  }
}

function existe_Usuario() {
  const usuario = sessionStorage.getItem("user");
  return JSON.parse(usuario) || [];
}

function existeBodega() {
  const bodegaStorage = sessionStorage.getItem("bodega");
  if (!bodegaStorage) return;

  try {
    const bodega = JSON.parse(bodegaStorage);
    if (Array.isArray(bodega) && bodega.length > 0) {
      const lblSucursal = document.getElementById("bodega-sucursal");
      const inputBodega = document.getElementById("bodega");
      if (lblSucursal) lblSucursal.innerHTML = bodega[0].NOMBRE;
      if (inputBodega) inputBodega.value = bodega[0].BODEGA;
    }
  } catch (e) {
    console.error("Error al leer bodega de sessionStorage:", e);
  }
}

async function abrirSelectorBodegas() {
  const usuario = existe_Usuario();
  if (!usuario || usuario.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sesión no válida",
      text: "Por favor inicie sesión nuevamente.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  Swal.fire({
    title: "Cargando sucursales...",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const response = await fetch(env.API_URL + "Tiendas?user=" + encodeURIComponent(usuario), {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const result = await response.json();
    console.log("==== RESPUESTA DEL API (Bodegas) ====", result);

    if (result.msg === "SUCCESS" && Array.isArray(result.tiendas) && result.tiendas.length > 0) {
      const inputOptions = {};
      const mapaNombres = {};
      const bodegaActual = document.getElementById("bodega")?.value || "";

      result.tiendas.forEach((item) => {
        inputOptions[item.BODEGA] = `${item.BODEGA} - ${item.NOMBRE}`;
        mapaNombres[item.BODEGA] = item.NOMBRE;
      });

      const { value: bodegaSeleccionada } = await Swal.fire({
        title: "Seleccionar Bodega o Sucursal",
        input: "select",
        inputOptions: inputOptions,
        inputValue: bodegaActual,
        inputPlaceholder: "Elija una sucursal...",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonText: "Cambiar sucursal",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6e7881",
        inputValidator: (value) => {
          if (!value) {
            return "Debe seleccionar una bodega";
          }
        },
      });

      if (bodegaSeleccionada) {
        const nombreTienda = mapaNombres[bodegaSeleccionada] || bodegaSeleccionada;
        sucursalbremen(nombreTienda, bodegaSeleccionada);
      }
    } else {
      Swal.fire({
        icon: "info",
        title: "Sin sucursales",
        text: "No se encontraron sucursales asignadas para este usuario.",
        confirmButtonColor: "#28a745",
      });
    }
  } catch (error) {
    console.error("Error cargando sucursales:", error);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudieron obtener las sucursales disponibles.",
      confirmButtonColor: "#d33",
    });
  }
}

function sucursalbremen(tienda, id_tienda) {
  console.log("Tienda seleccionada: " + tienda + " (ID: " + id_tienda + ")");

  const lblSucursal = document.getElementById("bodega-sucursal");
  const inputBodega = document.getElementById("bodega");

  if (lblSucursal) lblSucursal.innerHTML = tienda;
  if (inputBodega) {
    inputBodega.value = id_tienda;
    inputBodega.dispatchEvent(new Event("change"));
  }

  let perfilActual = "OPERADOR";
  try {
    const bodegaGuardada = JSON.parse(sessionStorage.getItem("bodega"));
    if (Array.isArray(bodegaGuardada) && bodegaGuardada[0]?.PERFIL) {
      perfilActual = bodegaGuardada[0].PERFIL;
    }
  } catch (e) {}

  const newbodega = [
    {
      BODEGA: id_tienda,
      NOMBRE: tienda,
      PERFIL: perfilActual,
    },
  ];
  sessionStorage.setItem("bodega", JSON.stringify(newbodega));

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  });

  Toast.fire({
    icon: "success",
    title: `Sucursal activa: ${tienda}`,
  });

  if (typeof fechasDeInventario === "function") {
    fechasDeInventario();
  }
  if (typeof limpiarResultadoGeneral === "function") {
    limpiarResultadoGeneral();
  }
}

function enlace(link) {
  if (link && link !== "#") {
    window.location.href = link;
  }
}

//-----------------------------------------------------------------------------------
// BUSCADOR GENERAL (CATÁLOGO / BÚSQUEDA) E INYECCIÓN DINÁMICA
//-----------------------------------------------------------------------------------

$("#articulo").on("keypress", function (e) {
  if (e.keyCode === 13 || e.keyCode === 9) {
    e.preventDefault();
    preBusqueda();
  }
});

$(document).ready(function () {$(".sidenav").sidenav();
  $(".tabs").tabs();
  $(".collapsible").collapsible();
  $(".modal").modal();
  $("select").formSelect();
  $(".dropdown-trigger").dropdown();
});
//-----------------------------------------------------------------------------------
// BUSQUEDA DE ARTICULOS
//-----------------------------------------------------------------------------------
function preBusqueda() {
  let pag = 1;
  let articulo = document.getElementById("articulo")?.value.trim() || "";
  const art = encodeURIComponent(articulo);
  let bodega = document.getElementById("bodega")?.value || "";
  let clase = localStorage.getItem("claseSelect") || "";
  let marca = localStorage.getItem("marcaSelect") || "";
  let tipo = localStorage.getItem("tipoSelect") || "";
  let envase = localStorage.getItem("envaseSelect") || "";

  const checkbox = document.getElementById("sinExistencias");
  const existenciaBusqueda = checkbox?.checked ? "N" : "S";

  const params = `?pActivos=S&pExistencia=${existenciaBusqueda}&pArticulo=${art}&pClase=${clase}&pMarca=${marca}&pUso=${tipo}&pEnvase=${envase}&pBodega=${bodega}&pTipoBodega=0`;

  if (typeof mostrarLoader === "function") mostrarLoader("Buscando artículos...");

  fetch(env.API_URL + "wmsbusquedaarticulos/1" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (typeof ocultarLoader === "function") ocultarLoader();

      console.log("==== RESPUESTA DEL API (Búsqueda General) ====", result);

      if (result && result.msg === "SUCCESS") {
        if (result.data && result.data.length > 0) {
          ArrayData = result.data;
          ArrayDataFiltrado = result.data;
          ArrayData2 = result.data;
          localStorage.setItem("articulo-Busqueda", JSON.stringify(ArrayData));

          let totales = ArrayDataFiltrado.length;
          let nPag = Math.ceil(totales / xPag);
          LimpiarFiltroPre(1);

          mostrarResultadosBusqueda(nPag, pag);
        } else {
          Swal.fire({
            icon: "info",
            title: "Sin resultados",
            text: "No hay resultado para la búsqueda: " + articulo,
            confirmButtonColor: "#28a745",
          });
          LimpiarFiltroPre(1);
        }
      } else {
         Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al consultar el servicio.",
            confirmButtonColor: "#d33",
          });
      }
    })
    .catch((error) => {
      if (typeof ocultarLoader === "function") ocultarLoader();
      console.error("Error en búsqueda:", error);
    });
}
//-----------------------------------------------------------------------------------
// function inyectarYMostrarBuscador
//-----------------------------------------------------------------------------------
function inyectarYMostrarBuscador(htm) {
  let resContainer = document.getElementById("resultadoBusqueda");
  
  // 1. Si no existe, lo inyectamos dinámicamente dentro del main
  if (!resContainer) {
    resContainer = document.createElement("div");
    resContainer.id = "resultadoBusqueda";
    resContainer.className = "vista-wrapper"; 
    
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.appendChild(resContainer);
    } else {
      document.body.appendChild(resContainer);
    }
  }

  // 2. Ocultar el resto de la vista operativa para que el buscador ocupe la pantalla
  document.querySelectorAll(".vista-wrapper").forEach(vw => {
    if(vw.id !== "resultadoBusqueda") {
      vw.style.display = "none";
    }
  });

  // 3. Renderizar el HTML dinámico
  resContainer.style.display = "block";
  resContainer.innerHTML = htm;

  $("html, body").animate({ scrollTop: 0 }, 500);

  if (typeof M !== "undefined") {
    if (M.FormSelect) M.FormSelect.init(resContainer.querySelectorAll("select"));
    if (M.Dropdown) M.Dropdown.init(resContainer.querySelectorAll(".dropdown-trigger"));
  }
}

window.cerrarBusquedaGlobal = function() {
  const resContainer = document.getElementById("resultadoBusqueda");
  if (resContainer) {
    resContainer.style.display = "none";
    resContainer.innerHTML = "";
  }
  
  // Restaurar la visibilidad de la vista operativa
  document.querySelectorAll(".vista-wrapper").forEach(vw => {
    if(vw.id !== "resultadoBusqueda") {
      vw.style.display = ""; 
    }
  });

  const artInput = document.getElementById("articulo");
  if(artInput) artInput.value = "";
};

function mostrarResultadosBusqueda(nPag, pag) {
  let htm = "";
  let desde = (pag - 1) * xPag;
  let hasta = Math.min(pag * xPag, ArrayDataFiltrado.length);

  if (desde >= ArrayDataFiltrado.length) {
    desde = 0;
    hasta = Math.min(xPag, ArrayDataFiltrado.length);
    pag = 1;
  }

  htm = mostrarResultados(desde, hasta);
  htm += paginador(nPag, pag);
  
  inyectarYMostrarBuscador(htm);
}

//-----------------------------------------------------------------------------------
// function mostrarResultados(desde, hasta) {
//   let htm = "";
//   let bodegaLabel = "";
//   let url = "";

//   // 1. Estilos CSS corregidos: Afecta solo a la imagen principal y ordena los íconos
//   htm += `<style>
//             .custom-grid-5 {
//               display: grid;
//               grid-template-columns: repeat(5, 1fr);
//               gap: 15px;
//               margin-top: 20px;
//             }
//             .custom-grid-5 .container-img {
//               background: #ffffff;
//               border: 1px solid #cbd5e1;
//               border-radius: 8px;
//               padding: 10px;
//               display: flex;
//               flex-direction: column;
//               justify-content: space-between;
//               box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//               transition: transform 0.2s ease;
//             }
//             .custom-grid-5 .container-img:hover {
//               transform: translateY(-3px);
//               box-shadow: 0 4px 8px rgba(0,0,0,0.1);
//             }
//             .custom-grid-5 #envoltorio {
//               position: relative;
//               width: 100%;
//               text-align: center;
//               margin-bottom: 10px;
//             }
            
//             /* CORRECCIÓN 1: Solo la imagen que está dentro de la etiqueta <a> se redimensiona */
//             .custom-grid-5 #envoltorio > a > img {
//               width: 100%;
//               height: 290px; 
//               object-fit: contain; 
//             }
            
//             /* CORRECCIÓN 2: Barra de acciones como flexbox horizontal */
//             .custom-grid-5 .flotante-acciones {
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               gap: 15px;
//               padding: 6px;
//               border-radius: 6px;
//               margin-top: 10px;
//             }
            
//             .custom-grid-5 .flotante-acciones a {
//               display: flex;
//               align-items: center;
//               cursor: pointer;
//             }

//             /* CORRECCIÓN 3: Blindar el tamaño de los íconos SVG para que no se estiren */
//             .custom-grid-5 .flotante-acciones img {
//               width: 22px !important;
//               height: 22px !important;
//               object-fit: contain;
//             }

//             .custom-grid-5 .articulo-titulo {
//               font-size: 13px;
//               font-weight: 700;
//               color: var(--primary-teal);
//               margin: 5px 0;
//               white-space: nowrap;
//               overflow: hidden;
//               text-overflow: ellipsis;
//             }
//             .custom-grid-5 h4 {
//               font-size: 11px;
//               color: #475569;
//               margin: 2px 0;
//               line-height: 1.3;
//               display: -webkit-box;
//               -webkit-line-clamp: 2;
//               -webkit-box-orient: vertical;
//               overflow: hidden;
//             }
            
//             /* Responsividad para pantallas más pequeñas */
//             @media (max-width: 1200px) { .custom-grid-5 { grid-template-columns: repeat(4, 1fr); } }
//             @media (max-width: 992px) { .custom-grid-5 { grid-template-columns: repeat(3, 1fr); } }
//             @media (max-width: 600px) { .custom-grid-5 { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
//           </style>`;

//   htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
//             <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
//               <i class="material-icons">close</i>
//               <span>Cerrar Búsqueda</span>
//             </button>
//           </div>`;

//   htm += '<div id="lista-articulo">';
//   htm += `<div class="col s12">
//             <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
//           </div>`;

//   htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">        
//           <div class="col s6 valign-wrapper">
//             <label>
//               <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
//               <span>Mostrar En Bodega</span>
//             </label>
//           </div>
//           <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
//             <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
//             <span style="font-size: 16px; color: var(--primary-teal);">${ArrayDataFiltrado.length}</span>
//           </div>
//         </div>
        
//         <div class="row" id="vistabusqueda" style="display: flex; gap: 10px;">
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaLista();">
//               <i class="material-icons left">list</i> VISTA LISTA
//             </button>
//           </div>
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
//               <i class="material-icons left">filter_list</i> FILTRAR
//             </button>
//           </div>
//         </div>`;

//   // 2. Aplicamos la nueva clase "custom-grid-5"
//   htm += '<div class="custom-grid-5">'; 

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       let DArticulo = ArrayDataFiltrado[i].ARTICULO.replace("/", "-");
//       const cantBodega = parseFloat(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA) || 0;

//       bodegaLabel = cantBodega > 0 ? `<span class="mi-tienda">En Bodega</span>` : ``;
//       url = `href="javascript:void(0);"`;

//       let colorReorden = "";
//       if (ArrayDataFiltrado[i].color === "R") colorReorden = "red accent-4";
//       else if (ArrayDataFiltrado[i].color === "A") colorReorden = "light-blue darken-1";
//       else if (ArrayDataFiltrado[i].color === "N") colorReorden = "deep-orange accent-3";
//       else if (ArrayDataFiltrado[i].color === "V") colorReorden = "green darken-1";

//       htm += `<div class="container-img">
//                  <div id="envoltorio">
//                    <a ${url}>                
//                      <img src="${env.API_IMAGE}/${DArticulo}" alt="${ArrayDataFiltrado[i].ARTICULO}">
//                      ${bodegaLabel}
//                    </a>
//                    <div class="flotante-acciones ${colorReorden}">
//                       <div class="link-flotante-acciones-forklift">
//                        <a onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">
//                          <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                       <div class="link-flotante-acciones-bar-code">
//                        <a onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                        <img src="./img/icon/bar-code.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                         <div class="link-flotante-acciones-information">
//                        <a onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                        <img src="./img/icon/information.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                    </div>          
//                  </div>
//                  <div class="info-articulo">
//                     <h3 class="articulo-titulo">${ArrayDataFiltrado[i].ARTICULO}</h3>
//                     <h4>${ArrayDataFiltrado[i].DESCRIPCION}</h4>
//                     <h4 style="font-weight:bold; color:#1e293b; margin-top:5px;">Cant: ${cantBodega.toFixed(2)}</h4>
//                  </div>
//               </div>`;
//     }
//   }
//   htm += "</div>"; 
//   htm += "</div>"; 
//   return htm;
// }
function mostrarResultados(desde, hasta) {
  let htm = "";
  let bodegaLabel = "";
  let url = "";

  htm += `<style>
            .custom-grid-5 {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .custom-grid-5 .container-img {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              transition: transform 0.2s ease;
            }
            .custom-grid-5 .container-img:hover {
              transform: translateY(-3px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .custom-grid-5 #envoltorio {
              position: relative;
              width: 100%;
              text-align: center;
              margin-bottom: 10px;
            }
            
            /* ALTURA POR DEFECTO: PC / MONITORES */
            .custom-grid-5 #envoltorio > a > img {
              width: 100%;
              height: 290px; 
              object-fit: contain; 
            }
            
            .custom-grid-5 .flotante-acciones {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 15px;
              padding: 6px;
              border-radius: 6px;
              margin-top: 10px;
            }
            
            .custom-grid-5 .flotante-acciones a {
              display: flex;
              align-items: center;
              cursor: pointer;
            }

            .custom-grid-5 .flotante-acciones img {
              width: 22px !important;
              height: 22px !important;
              object-fit: contain;
            }

            .custom-grid-5 .articulo-titulo {
              font-size: 13px;
              font-weight: 700;
              color: var(--primary-teal);
              margin: 5px 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .custom-grid-5 h4 {
              font-size: 11px;
              color: #475569;
              margin: 2px 0;
              line-height: 1.3;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            /* Responsividad para pantallas más pequeñas */
            @media (max-width: 1200px) { .custom-grid-5 { grid-template-columns: repeat(4, 1fr); } }
            @media (max-width: 992px) { 
              .custom-grid-5 { grid-template-columns: repeat(3, 1fr); }
              .custom-grid-5 #envoltorio > a > img { height: 220px; } /* Ajuste intermedio para Tablets */
            }
            @media (max-width: 600px) { 
              .custom-grid-5 { grid-template-columns: repeat(2, 1fr); gap: 10px; } 
              /* ALTURA PARA MÓVILES */
              .custom-grid-5 #envoltorio > a > img { height: 165px; }
            }
          </style>`;

  htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
            <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
              <i class="material-icons">close</i>
              <span>Cerrar Búsqueda</span>
            </button>
          </div>`;

  htm += '<div id="lista-articulo">';
  htm += `<div class="col s12">
            <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
          </div>`;

  htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">        
          <div class="col s6 valign-wrapper">
            <label>
              <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
              <span>Mostrar En Bodega</span>
            </label>
          </div>
          <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
            <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
            <span style="font-size: 16px; color: var(--primary-teal);">${ArrayDataFiltrado.length}</span>
          </div>
        </div>
        
        <div class="row" id="vistabusqueda" style="display: flex; gap: 10px;">
          <div class="col s6" style="padding: 0;">
            <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaLista();">
              <i class="material-icons left">list</i> VISTA LISTA
            </button>
          </div>
          <div class="col s6" style="padding: 0;">
            <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
              <i class="material-icons left">filter_list</i> FILTRAR
            </button>
          </div>
        </div>`;

  htm += '<div class="custom-grid-5">'; 

  for (let i = desde; i < hasta; i++) {
    if (ArrayDataFiltrado[i]) {
      let DArticulo = ArrayDataFiltrado[i].ARTICULO.replace("/", "-");
      const cantBodega = parseFloat(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA) || 0;

      bodegaLabel = cantBodega > 0 ? `<span class="mi-tienda">En Bodega</span>` : ``;
      url = `href="javascript:void(0);"`;

      let colorReorden = "";
      if (ArrayDataFiltrado[i].color === "R") colorReorden = "red accent-4";
      else if (ArrayDataFiltrado[i].color === "A") colorReorden = "light-blue darken-1";
      else if (ArrayDataFiltrado[i].color === "N") colorReorden = "deep-orange accent-3";
      else if (ArrayDataFiltrado[i].color === "V") colorReorden = "green darken-1";

      htm += `<div class="container-img">
                 <div id="envoltorio">
                   <a ${url}>                
                     <img src="${env.API_IMAGE}/${DArticulo}" alt="${ArrayDataFiltrado[i].ARTICULO}">
                     ${bodegaLabel}
                   </a>
                   <div class="flotante-acciones ${colorReorden}">
                      <div class="link-flotante-acciones-forklift">
                       <a onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">
                         <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22">
                       </a>             
                     </div>
                      <div class="link-flotante-acciones-bar-code">
                       <a onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
                       <img src="./img/icon/bar-code.svg" width="22" height="22">
                       </a>             
                     </div>
                        <div class="link-flotante-acciones-information">
                       <a onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
                       <img src="./img/icon/information.svg" width="22" height="22">
                       </a>             
                     </div>
                   </div>          
                 </div>
                 <div class="info-articulo">
                    <h3 class="articulo-titulo">${ArrayDataFiltrado[i].ARTICULO}</h3>
                    <h4>${ArrayDataFiltrado[i].DESCRIPCION}</h4>
                    <h4 style="font-weight:bold; color:#1e293b; margin-top:5px;">Cant: ${cantBodega.toFixed(2)}</h4>
                 </div>
              </div>`;
    }
  }
  htm += "</div>"; 
  htm += "</div>"; 
  return htm;
}
function cambiarVistaMosaico() {
  let totales = ArrayDataFiltrado.length;
  let nPag = Math.ceil(totales / xPag);
  mostrarResultadosBusqueda(nPag, 1);
}

function cambiarVistaLista() {
  const bodega = JSON.parse(sessionStorage.getItem("bodega"));
  let bodegaCod = bodega ? bodega[0].BODEGA : "";
  let totalRegistros = ArrayDataFiltrado.length;
  let pag = 1; 
  let desde = (pag - 1) * xPag;
  let hasta = Math.min(pag * xPag, totalRegistros);
  let nPag = Math.ceil(totalRegistros / xPag);
  let htm = "";

  htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
            <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
              <i class="material-icons">close</i>
              <span>Cerrar Búsqueda</span>
            </button>
          </div>`;

  htm += '<div id="lista-articulo">';
  htm += `<div class="col s12">
          <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
          </div>`;

  htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">          
            <div class="col s6 valign-wrapper">
              <label>
                <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
                <span>Mostrar En Bodega</span>
              </label>
            </div>
            <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
              <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
              <span style="font-size: 16px; color: var(--primary-teal);">${totalRegistros}</span>
            </div>
          </div>
          <div class="row" style="display: flex; gap: 10px;">
            <div class="col s6" style="padding: 0;">
                <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaMosaico();">
              <i class="material-icons left">apps</i> VISTA MOSAICO </button>
            </div>
            <div class="col s6" style="padding: 0;">
              <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
              <i class="material-icons left">filter_list</i> FILTRAR </button>
            </div>
          </div>`;

  htm += `<div class="grid-table-responsive" style="margin-top: 20px; overflow-x: auto;">
            <table class="tabla-transacciones" style="min-width: 600px;">
            <thead>
              <tr>
                <th style="width:30%; text-align: left;">Código / Desc.</th>
                <th style="width:30%;">Código de Barras</th>
                <th style="width:10%;">En ${bodegaCod}</th>
                <th style="width:30%; text-align: center;">Opc.</th>
              </tr>
            </thead>
            <tbody>`;

  for (let i = desde; i < hasta; i++) {
    if (ArrayDataFiltrado[i]) {
      htm += `<tr>`;
      htm += `<td style="text-align: left;">
                <div class="cell-articulo-box">
                  <span class="cell-articulo-code" style="color: var(--articulo-orange);">${ArrayDataFiltrado[i].ARTICULO}</span>
                  <span class="cell-articulo-desc">${ArrayDataFiltrado[i].DESCRIPCION}</span>
                </div>
              </td>
              <td class="cell-center">${ArrayDataFiltrado[i].CODIGO_BARRAS_INVT ? ArrayDataFiltrado[i].CODIGO_BARRAS_INVT : ""}</td>
              <td class="cell-number">${Math.floor(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA)}</td>
              <td class="cell-center" style="white-space: nowrap;">
                <i class="material-symbols-outlined" style="cursor: pointer; color: #64748b; margin: 0 4px; vertical-align: middle;" onclick="mostrarImagen('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}', '${ArrayDataFiltrado[i].DESCRIPCION}')">visibility</i>              
                <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">                
                <img src="./img/icon/bar-code.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
                <img src="./img/icon/information.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
              </td>`;
      htm += `</tr>`;
    }
  }

  htm += `</tbody></table></div>`;

  htm += `<div id="resultadoPaginador" style="margin-top: 20px;">`;
  htm += paginador(nPag, pag); // Utilizar el paginador global para Vista Lista
  htm += `</div></div>`;

  inyectarYMostrarBuscador(htm);
}

//------------------------------------------------------------------------------------
// PAGINADOR UNIFICADO PARA RESULTADOS DE BÚSQUEDA (GRID / MOSAICO)
//------------------------------------------------------------------------------------
function paginador(nPag, pag) {
  let selected = "";
  let sel = `<select class="browser-default paginador-select" onchange="mostrarResultadosBusqueda(${nPag}, this.value)">
              <option value="" disabled>Páginas</option>`;

  for (let i = 0; i < nPag; i++) {
    selected = (i + 1 == pag) ? "selected" : "";
    if (nPag != 1) {
      sel += `<option value="${i + 1}" ${selected}>Pág ${i + 1}</option>`;
    }
  }
  sel += `</select>`;

  const btnAtras = pag <= 1
      ? `<a class="paginador-btn disabled">❮ Anterior</a>`
      : `<a class="paginador-btn" onclick="mostrarResultadosBusqueda(${nPag}, ${parseInt(pag) - 1})">❮ Anterior</a>`;

  const btnSig = pag >= nPag
      ? `<a class="paginador-btn disabled">Siguiente ❯</a>`
      : `<a class="paginador-btn" onclick="mostrarResultadosBusqueda(${nPag}, ${parseInt(pag) + 1})">Siguiente ❯</a>`;

  return `
    <div class="paginador-container" style="margin-top: 20px;">
      <div class="row paginador-info" style="margin-bottom: 5px;">
        <div class="col s12 center-align" style="font-weight: bold; color: #475569; font-size: 13px;">
          Página ${pag} de ${nPag}
        </div>
      </div>
      <div class="row paginador-controls" style="display: flex; justify-content: center; gap: 15px; align-items: center;">
        <div class="paginador-btn-container">${btnAtras}</div>
        <div class="paginador-select-container" style="min-width: 110px;">${sel}</div>
        <div class="paginador-btn-container">${btnSig}</div>
      </div>
    </div>
  `;
}

//------------------------------------------------------------------------------------
// PAGINADOR UNIFICADO PARA VISTA DE TABLA (LISTA)
//------------------------------------------------------------------------------------
function paginadorTablas(nPag, pag, dynamicFunction) {
  let selected = "";
  let sel = `<select class="browser-default paginador-select" onchange="${dynamicFunction}(${nPag}, this.value)">
              <option value="" disabled>Páginas</option>`;

  for (let i = 0; i < nPag; i++) {
    selected = (i + 1 == pag) ? "selected" : "";
    if (nPag != 1) {
      sel += `<option value="${i + 1}" ${selected}>Pág ${i + 1}</option>`;
    }
  }
  sel += `</select>`;

  const btnAtras = pag <= 1
      ? `<a class="paginador-btn disabled">❮ Anterior</a>`
      : `<a class="paginador-btn" onclick="${dynamicFunction}(${nPag}, ${parseInt(pag) - 1})">❮ Anterior</a>`;

  const btnSig = pag >= nPag
      ? `<a class="paginador-btn disabled">Siguiente ❯</a>`
      : `<a class="paginador-btn" onclick="${dynamicFunction}(${nPag}, ${parseInt(pag) + 1})">Siguiente ❯</a>`;

  return `
    <div class="paginador-container">
      <div class="row paginador-info" style="margin-bottom: 5px;">
        <div class="col s12 center-align" style="font-weight: bold; color: #475569; font-size: 13px;">
          Página ${pag} de ${nPag}
        </div>
      </div>
      <div class="row paginador-controls" style="display: flex; justify-content: center; gap: 15px; align-items: center;">
        <div class="paginador-btn-container">${btnAtras}</div>
        <div class="paginador-select-container" style="min-width: 110px;">${sel}</div>
        <div class="paginador-btn-container">${btnSig}</div>
      </div>
    </div>
  `;
}
//-----------------------------------------------------------------------------------
// FILTRADO DE RESULTADOS EN BODEGA
//-----------------------------------------------------------------------------------
var articulosConExistencia = new Array();

function toggleMostrarEnBodega() {
  const check = document.getElementById("miCheckbox");
  const isChecked = check.checked;

  localStorage.setItem("mostrarEnBodega", isChecked ? "1" : "0");

  if (isChecked) {
    // Filtrar solo artículos con existencia real en bodega > 0
    articulosConExistencia = ArrayData2.filter(
      (item) => parseFloat(item.TOTAL_CANTIDAD_BODEGA) > 0
    );
    
    let nPag = Math.ceil(articulosConExistencia.length / xPag);
    let pag = 1;

    mostrarResultadosBusquedaEnBodega(nPag, pag);
  } else {
    // Restaurar a todos los resultados
    let pag = 1;
    let totales = ArrayDataFiltrado.length;
    let nPag = Math.ceil(totales / xPag);
    
    mostrarResultadosBusqueda(nPag, pag);
  }
}

//-----------------------------------------------------------------------------------
// RENDERIZADO CUADRÍCULA EN BODEGA
//-----------------------------------------------------------------------------------
function mostrarResultadosBusquedaEnBodega(nPag, pag) {
  let htm = "";
  let desde = (pag - 1) * xPag;
  let data = articulosConExistencia;
  let hasta = Math.min(pag * xPag, data.length);

  if (desde >= data.length) {
    desde = 0;
    hasta = Math.min(xPag, data.length);
    pag = 1;
  }

  htm = mostrarResultadosEnBodega(desde, hasta, data);
  htm += paginadorEnBodega(nPag, pag);

  inyectarYMostrarBuscador(htm);

  setTimeout(() => {
    const checkElement = document.getElementById("miCheckbox");
    if (checkElement) {
      checkElement.checked = localStorage.getItem("mostrarEnBodega") === "1";
    }
  }, 100);
}

// function mostrarResultadosEnBodega(desde, hasta, data) {
//   let htm = "";
//   let bodegaLabel = "";
//   let url = "";

//   htm += `<style>
//             .custom-grid-5 {
//               display: grid;
//               grid-template-columns: repeat(5, 1fr);
//               gap: 15px;
//               margin-top: 20px;
//             }
//             .custom-grid-5 .container-img {
//               background: #ffffff;
//               border: 1px solid #cbd5e1;
//               border-radius: 8px;
//               padding: 10px;
//               display: flex;
//               flex-direction: column;
//               justify-content: space-between;
//               box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//               transition: transform 0.2s ease;
//             }
//             .custom-grid-5 .container-img:hover {
//               transform: translateY(-3px);
//               box-shadow: 0 4px 8px rgba(0,0,0,0.1);
//             }
//             .custom-grid-5 #envoltorio {
//               position: relative;
//               width: 100%;
//               text-align: center;
//               margin-bottom: 10px;
//             }
//             .custom-grid-5 #envoltorio > a > img {
//               width: 100%;
//               height: 140px; 
//               object-fit: contain; 
//             }
//             .custom-grid-5 .flotante-acciones {
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               gap: 15px;
//               padding: 6px;
//               border-radius: 6px;
//               margin-top: 10px;
//             }
//             .custom-grid-5 .flotante-acciones a {
//               display: flex;
//               align-items: center;
//               cursor: pointer;
//             }
//             .custom-grid-5 .flotante-acciones img {
//               width: 22px !important;
//               height: 22px !important;
//               object-fit: contain;
//             }
//             .custom-grid-5 .articulo-titulo {
//               font-size: 13px;
//               font-weight: 700;
//               color: var(--primary-teal);
//               margin: 5px 0;
//               white-space: nowrap;
//               overflow: hidden;
//               text-overflow: ellipsis;
//             }
//             .custom-grid-5 h4 {
//               font-size: 11px;
//               color: #475569;
//               margin: 2px 0;
//               line-height: 1.3;
//               display: -webkit-box;
//               -webkit-line-clamp: 2;
//               -webkit-box-orient: vertical;
//               overflow: hidden;
//             }
//             @media (max-width: 1200px) { .custom-grid-5 { grid-template-columns: repeat(4, 1fr); } }
//             @media (max-width: 992px) { .custom-grid-5 { grid-template-columns: repeat(3, 1fr); } }
//             @media (max-width: 600px) { .custom-grid-5 { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
//           </style>`;

//   htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
//             <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
//               <i class="material-icons">close</i>
//               <span>Cerrar Búsqueda</span>
//             </button>
//           </div>`;

//   htm += '<div id="lista-articulo">';
//   htm += `<div class="col s12">
//             <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
//           </div>`;

//   htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">        
//           <div class="col s6 valign-wrapper">
//             <label>
//               <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
//               <span>Mostrar En Bodega</span>
//             </label>
//           </div>
//           <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
//             <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
//             <span style="font-size: 16px; color: var(--primary-teal);">${data.length}</span>
//           </div>
//         </div>
        
//         <div class="row" id="vistabusqueda" style="display: flex; gap: 10px;">
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaListaEnBodega();">
//               <i class="material-icons left">list</i> VISTA LISTA
//             </button>
//           </div>
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
//               <i class="material-icons left">filter_list</i> FILTRAR
//             </button>
//           </div>
//         </div>`;

//   htm += '<div class="custom-grid-5">'; 

//   for (let i = desde; i < hasta; i++) {
//     if (data[i]) {
//       let DArticulo = data[i].ARTICULO.replace("/", "-");
//       const cantBodega = parseFloat(data[i].TOTAL_CANTIDAD_BODEGA) || 0;

//       bodegaLabel = `<span class="mi-tienda">En Bodega</span>`;
//       url = `href="javascript:void(0);"`;

//       let colorReorden = "";
//       if (data[i].color === "R") colorReorden = "red accent-4";
//       else if (data[i].color === "A") colorReorden = "light-blue darken-1";
//       else if (data[i].color === "N") colorReorden = "deep-orange accent-3";
//       else if (data[i].color === "V") colorReorden = "green darken-1";

//       htm += `<div class="container-img">
//                  <div id="envoltorio">
//                    <a ${url}>                
//                      <img src="${env.API_IMAGE}/${DArticulo}" alt="${data[i].ARTICULO}">
//                      ${bodegaLabel}
//                    </a>
//                    <div class="flotante-acciones ${colorReorden}">
//                       <div class="link-flotante-acciones-forklift">
//                        <a onclick="mostrarExistencias('${encodeURIComponent(data[i].ARTICULO)}')">
//                          <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                       <div class="link-flotante-acciones-bar-code">
//                        <a onclick="impCodBar('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
//                        <img src="./img/icon/bar-code.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                         <div class="link-flotante-acciones-information">
//                        <a onclick="information('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
//                        <img src="./img/icon/information.svg" width="22" height="22">
//                        </a>             
//                      </div>
//                    </div>          
//                  </div>
//                  <div class="info-articulo">
//                     <h3 class="articulo-titulo">${data[i].ARTICULO}</h3>
//                     <h4>${data[i].DESCRIPCION}</h4>
//                     <h4 style="font-weight:bold; color:#1e293b; margin-top:5px;">Cant: ${cantBodega.toFixed(2)}</h4>
//                  </div>
//               </div>`;
//     }
//   }
//   htm += "</div>"; 
//   htm += "</div>"; 
//   return htm;
// }

//-----------------------------------------------------------------------------------
// RENDERIZADO LISTA EN BODEGA
//-----------------------------------------------------------------------------------
function mostrarResultadosEnBodega(desde, hasta, data) {
  let htm = "";
  let bodegaLabel = "";
  let url = "";

  htm += `<style>
            .custom-grid-5 {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .custom-grid-5 .container-img {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              transition: transform 0.2s ease;
            }
            .custom-grid-5 .container-img:hover {
              transform: translateY(-3px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .custom-grid-5 #envoltorio {
              position: relative;
              width: 100%;
              text-align: center;
              margin-bottom: 10px;
            }
            
            /* ALTURA POR DEFECTO: PC / MONITORES */
            .custom-grid-5 #envoltorio > a > img {
              width: 100%;
              height: 290px; 
              object-fit: contain; 
            }
            
            .custom-grid-5 .flotante-acciones {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 15px;
              padding: 6px;
              border-radius: 6px;
              margin-top: 10px;
            }
            .custom-grid-5 .flotante-acciones a {
              display: flex;
              align-items: center;
              cursor: pointer;
            }
            .custom-grid-5 .flotante-acciones img {
              width: 22px !important;
              height: 22px !important;
              object-fit: contain;
            }
            .custom-grid-5 .articulo-titulo {
              font-size: 13px;
              font-weight: 700;
              color: var(--primary-teal);
              margin: 5px 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .custom-grid-5 h4 {
              font-size: 11px;
              color: #475569;
              margin: 2px 0;
              line-height: 1.3;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            /* Responsividad para pantallas más pequeñas */
            @media (max-width: 1200px) { .custom-grid-5 { grid-template-columns: repeat(4, 1fr); } }
            @media (max-width: 992px) { 
              .custom-grid-5 { grid-template-columns: repeat(3, 1fr); }
              .custom-grid-5 #envoltorio > a > img { height: 220px; } /* Ajuste intermedio para Tablets */
            }
            @media (max-width: 600px) { 
              .custom-grid-5 { grid-template-columns: repeat(2, 1fr); gap: 10px; } 
              /* ALTURA PARA MÓVILES */
              .custom-grid-5 #envoltorio > a > img { height: 165px; }
            }
          </style>`;

  htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
            <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
              <i class="material-icons">close</i>
              <span>Cerrar Búsqueda</span>
            </button>
          </div>`;

  htm += '<div id="lista-articulo">';
  htm += `<div class="col s12">
            <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
          </div>`;

  htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">        
          <div class="col s6 valign-wrapper">
            <label>
              <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
              <span>Mostrar En Bodega</span>
            </label>
          </div>
          <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
            <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
            <span style="font-size: 16px; color: var(--primary-teal);">${data.length}</span>
          </div>
        </div>
        
        <div class="row" id="vistabusqueda" style="display: flex; gap: 10px;">
          <div class="col s6" style="padding: 0;">
            <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaListaEnBodega();">
              <i class="material-icons left">list</i> VISTA LISTA
            </button>
          </div>
          <div class="col s6" style="padding: 0;">
            <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
              <i class="material-icons left">filter_list</i> FILTRAR
            </button>
          </div>
        </div>`;

  htm += '<div class="custom-grid-5">'; 

  for (let i = desde; i < hasta; i++) {
    if (data[i]) {
      let DArticulo = data[i].ARTICULO.replace("/", "-");
      const cantBodega = parseFloat(data[i].TOTAL_CANTIDAD_BODEGA) || 0;

      bodegaLabel = `<span class="mi-tienda">En Bodega</span>`;
      url = `href="javascript:void(0);"`;

      let colorReorden = "";
      if (data[i].color === "R") colorReorden = "red accent-4";
      else if (data[i].color === "A") colorReorden = "light-blue darken-1";
      else if (data[i].color === "N") colorReorden = "deep-orange accent-3";
      else if (data[i].color === "V") colorReorden = "green darken-1";

      htm += `<div class="container-img">
                 <div id="envoltorio">
                   <a ${url}>                
                     <img src="${env.API_IMAGE}/${DArticulo}" alt="${data[i].ARTICULO}">
                     ${bodegaLabel}
                   </a>
                   <div class="flotante-acciones ${colorReorden}">
                      <div class="link-flotante-acciones-forklift">
                       <a onclick="mostrarExistencias('${encodeURIComponent(data[i].ARTICULO)}')">
                         <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22">
                       </a>             
                     </div>
                      <div class="link-flotante-acciones-bar-code">
                       <a onclick="impCodBar('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
                       <img src="./img/icon/bar-code.svg" width="22" height="22">
                       </a>             
                     </div>
                        <div class="link-flotante-acciones-information">
                       <a onclick="information('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
                       <img src="./img/icon/information.svg" width="22" height="22">
                       </a>             
                     </div>
                   </div>          
                 </div>
                 <div class="info-articulo">
                    <h3 class="articulo-titulo">${data[i].ARTICULO}</h3>
                    <h4>${data[i].DESCRIPCION}</h4>
                    <h4 style="font-weight:bold; color:#1e293b; margin-top:5px;">Cant: ${cantBodega.toFixed(2)}</h4>
                 </div>
              </div>`;
    }
  }
  htm += "</div>"; 
  htm += "</div>"; 
  return htm;
}

function cambiarVistaMosaicoEnBodega() {
  let totales = articulosConExistencia.length;
  let nPag = Math.ceil(totales / xPag);
  mostrarResultadosBusquedaEnBodega(nPag, 1);
}

function cambiarVistaListaEnBodega() {
  const bodega = JSON.parse(sessionStorage.getItem("bodega"));
  let bodegaCod = bodega ? bodega[0].BODEGA : "";

  window.ArticulosBodegaFiltrados = ArrayDataFiltrado.filter(
    (item) => parseFloat(item.TOTAL_CANTIDAD_BODEGA) > 0
  );

  let totalRegistros = window.ArticulosBodegaFiltrados.length;
  let pag = 1; 
  let desde = (pag - 1) * xPag;
  let hasta = Math.min(pag * xPag, totalRegistros);
  let nPag = Math.ceil(totalRegistros / xPag);
  let htm = "";

  htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
            <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
              <i class="material-icons">close</i>
              <span>Cerrar Búsqueda</span>
            </button>
          </div>`;

  htm += '<div id="lista-articulo">';
  htm += `<div class="col s12">
          <h1 class="titulo-principal" style="font-size: 20px;">RESULTADOS DE LA BÚSQUEDA</h1>
          </div>`;

  htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">          
            <div class="col s6 valign-wrapper">
              <label>
                <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
                <span>Mostrar En Bodega</span>
              </label>
            </div>
            <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
              <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
              <span style="font-size: 16px; color: var(--primary-teal);">${totalRegistros}</span>
            </div>
          </div>
          <div class="row" style="display: flex; gap: 10px;">
            <div class="col s6" style="padding: 0;">
                <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; height: 38px;" onclick="cambiarVistaMosaicoEnBodega();">
              <i class="material-icons left">apps</i> VISTA MOSAICO </button>
            </div>
            <div class="col s6" style="padding: 0;">
              <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b; height: 38px;" onclick="FiltrarModal();">
              <i class="material-icons left">filter_list</i> FILTRAR </button>
            </div>
          </div>`;

  htm += `<div class="grid-table-responsive" style="margin-top: 20px; overflow-x: auto;">
            <table class="tabla-transacciones" style="min-width: 600px;">
            <thead>
              <tr>
                <th style="width:30%; text-align: left;">Código / Desc.</th>
                <th style="width:30%;">Código de Barras</th>
                <th style="width:10%;">En ${bodegaCod}</th>
                <th style="width:30%; text-align: center;">Opc.</th>
              </tr>
            </thead>
            <tbody id="tablaBodyEnBodega">`;

  htm += _generarFilasTablaBodega(desde, hasta);

  htm += `</tbody></table></div>`;

  htm += `<div id="resultadoPaginador" style="margin-top: 20px;">`;
  htm += paginadorEnBodega(nPag, pag, "mostrarResultadosVistaListaEnBodega");
  htm += `</div></div>`;

  inyectarYMostrarBuscador(htm);

  setTimeout(() => {
    const checkElement = document.getElementById("miCheckbox");
    if (checkElement) {
      checkElement.checked = localStorage.getItem("mostrarEnBodega") === "1";
    }
  }, 100);
}

function mostrarResultadosVistaListaEnBodega(nPag, pag) {
  let desde = (pag - 1) * xPag;
  const data = window.ArticulosBodegaFiltrados || [];
  let hasta = Math.min(pag * xPag, data.length);

  if (desde >= data.length) {
    desde = 0;
    hasta = Math.min(xPag, data.length);
    pag = 1;
  }

  const tablaBody = document.getElementById("tablaBodyEnBodega");
  if (tablaBody) {
    tablaBody.innerHTML = _generarFilasTablaBodega(desde, hasta);
  }

  const paginadorHtml = paginadorEnBodega(nPag, pag, "mostrarResultadosVistaListaEnBodega");
  const paginadorElement = document.getElementById("resultadoPaginador");
  if (paginadorElement) {
    paginadorElement.innerHTML = paginadorHtml;
  }

  $("html, body").animate({ scrollTop: 0 }, 500);
}

function _generarFilasTablaBodega(desde, hasta) {
  const data = window.ArticulosBodegaFiltrados || [];
  let rows = "";

  for (let i = desde; i < hasta; i++) {
    if (data[i]) {
      rows += `<tr>
        <td style="text-align: left;">
          <div class="cell-articulo-box">
            <span class="cell-articulo-code" style="color: var(--articulo-orange);">${data[i].ARTICULO}</span>
            <span class="cell-articulo-desc">${data[i].DESCRIPCION}</span>
          </div>
        </td>
        <td class="cell-center">${data[i].CODIGO_BARRAS_INVT || ""}</td>
        <td class="cell-number">${Math.floor(data[i].TOTAL_CANTIDAD_BODEGA)}</td>
        <td class="cell-center" style="white-space: nowrap;">
          <i class="material-symbols-outlined" style="cursor: pointer; color: #64748b; margin: 0 4px; vertical-align: middle;" onclick="mostrarImagen('${encodeURIComponent(data[i].ARTICULO)}', '${data[i].DESCRIPCION}')">visibility</i>
          <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="mostrarExistencias('${encodeURIComponent(data[i].ARTICULO)}')">
          <img src="./img/icon/bar-code.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="impCodBar('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
          <img src="./img/icon/information.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px; vertical-align: middle;" onclick="information('${data[i].ARTICULO}','${data[i].DESCRIPCION}')">
        </td>
      </tr>`;
    }
  }
  return rows;
}

//------------------------------------------------------------------------------------
// PAGINADOR UNIFICADO PARA BODEGA (SE USA TANTO EN MOSAICO COMO EN LISTA)
//------------------------------------------------------------------------------------
function paginadorEnBodega(nPag, pag, funcionDinamica = "mostrarResultadosBusquedaEnBodega") {
  let selected = "";
  let sel = `<select class="browser-default paginador-select" onchange="${funcionDinamica}(${nPag}, this.value)">
              <option value="" disabled>Páginas</option>`;

  for (let i = 0; i < nPag; i++) {
    selected = (i + 1 == pag) ? "selected" : "";
    if (nPag != 1) {
      sel += `<option value="${i + 1}" ${selected}>Pág ${i + 1}</option>`;
    }
  }
  sel += `</select>`;

  const btnAtras = pag <= 1
      ? `<a class="paginador-btn disabled">❮ Anterior</a>`
      : `<a class="paginador-btn" onclick="${funcionDinamica}(${nPag}, ${parseInt(pag) - 1})">❮ Anterior</a>`;

  const btnSig = pag >= nPag
      ? `<a class="paginador-btn disabled">Siguiente ❯</a>`
      : `<a class="paginador-btn" onclick="${funcionDinamica}(${nPag}, ${parseInt(pag) + 1})">Siguiente ❯</a>`;

  return `
    <div class="paginador-container" style="margin-top: 20px;">
      <div class="row paginador-info" style="margin-bottom: 5px;">
        <div class="col s12 center-align" style="font-weight: bold; color: #475569; font-size: 13px;">
          Página ${pag} de ${nPag}
        </div>
      </div>
      <div class="row paginador-controls" style="display: flex; justify-content: center; gap: 15px; align-items: center;">
        <div class="paginador-btn-container">${btnAtras}</div>
        <div class="paginador-select-container" style="min-width: 110px;">${sel}</div>
        <div class="paginador-btn-container">${btnSig}</div>
      </div>
    </div>
  `;
}
// =============================================================================
// UTILIDADES, FILTROS Y OTROS MODALES
// =============================================================================
function filtrosModal() {
  let htm = "", IDCategoria = "1055";
  let elem = document.getElementById("modalFiltro");
  if(!elem) return;
  
  let instance = M.Modal.getInstance(elem) || M.Modal.init(elem);
  instance.open();

  localStorage.removeItem("claseSelect");
  htm = ` <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>CLASE</div>
                <div class="collapsible-body">
                  <div id="filtroclase" style="padding-left: 10px"></div>
                    <input type="hidden" value="" id="txtClaseV" name="txtClaseV">
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>MARCA</div>
                <div class="collapsible-body">
                    <div id="filtromarca" style="padding-left: 10px"></div>
                      <input type="hidden" value="" id="txtMarcaV" name="txtMarcaV" >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>TIPO</div>
                <div class="collapsible-body">
                    <div id="filtrotipo" style="padding-left: 10px"></div>
                      <input type="hidden" value="" id="txtTipo" name="txtTipo" >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>SUBTIPO</div>
                <div class="collapsible-body">
                    <div id="filtrosubtipo" style="padding-left: 10px"></div>
                      <input type="hidden" value="" id="txtSubtipo" name="txtSubtipo" >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>SUBTIPO2</div>
                <div class="collapsible-body">
                    <div id="filtrosubtipo2" style="padding-left: 10px"></div>
                      <input type="hidden" value="" id="txtSubtipo2" name="txtSubtipo2" >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <ul class="collapsible">
              <li>
                <div class="collapsible-header"><i class="material-icons">add</i>ENVASE</div>
                <div class="collapsible-body">
                    <div id="filtroenvase" style="padding-left: 10px"></div>
                      <input type="hidden" value="" id="txtEnvase" name="txtEnvase" >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="row" style="margin-top:20px; display: flex; gap: 10px;">
          <div class="col s6" style="padding: 0;">
            <a onclick="preBusqueda();" class="btn-buscar-gradient" style="width: 100%; border-radius: 8px;">
              <i class="material-icons left">check</i> Aceptar
            </a>
          </div>
          <div class="col s6" style="padding: 0;">
            <a onclick="LimpiarFiltroPre(1);" class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b;">
              <i class="material-icons left">update</i> Limpiar
            </a>
          </div>
        </div>`;

  document.getElementById("divFiltro").innerHTML = htm;

  getFiltros()
    .then(() => {
      document.getElementById("filtroclase").innerHTML = MostrarClases(1);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  if (typeof M !== "undefined") {
    M.Collapsible.init(document.querySelectorAll('.collapsible'));
  }
}

function getFiltros(clase = "", marca = "", tipo = "", subtipo = "", subtipo2 = "", envase = "") {
  const params = `?clase=${encodeURIComponent(clase)}&marca=${encodeURIComponent(marca)}&tipo=${encodeURIComponent(tipo)}&subtipo=${encodeURIComponent(subtipo)}&subtipo2=${encodeURIComponent(subtipo2)}&envase=${encodeURIComponent(envase)}`;

  return fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        ArrayData = formatData(result.filtros);

        if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_2"))) {
          localStorage.setItem("claseSelect", clase);
          document.getElementById("filtromarca").innerHTML = MostrarMarcas(1);
        } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_3"))) {
          localStorage.setItem("marcaSelect", marca);
          document.getElementById("filtrotipo").innerHTML = MostrarTipos(1);
        } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_4"))) {
          localStorage.setItem("tipoSelect", tipo);
          document.getElementById("filtrosubtipo").innerHTML = MostrarSubTipos(1);
        } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_5"))) {
          localStorage.setItem("subtipoSelect", subtipo);
          document.getElementById("filtrosubtipo2").innerHTML = MostrarSubTipos2(1);
        } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_6"))) {
          localStorage.setItem("subtipo2Select", subtipo2);
          document.getElementById("filtroenvase").innerHTML = MostrarEnvases(1);
        }
      }
    });
}

function formatData(data) {
  return data.map((item) => {
    if ("DESCRIPCION" in item) {
      if ("CLASIFICACION_1" in item) return { CLASIFICACION_1: item.CLASIFICACION_1, CLASE: item.DESCRIPCION };
      if ("CLASIFICACION_2" in item) return { CLASIFICACION_2: item.CLASIFICACION_2, MARCA: item.DESCRIPCION };
      if ("CLASIFICACION_3" in item) return { CLASIFICACION_3: item.CLASIFICACION_3, TIPO: item.DESCRIPCION };
      if ("CLASIFICACION_4" in item) return { CLASIFICACION_4: item.CLASIFICACION_4, SUBTIPO: item.DESCRIPCION };
      if ("CLASIFICACION_5" in item) return { CLASIFICACION_5: item.CLASIFICACION_5, SUBTIPO2: item.DESCRIPCION };
      if ("CLASIFICACION_6" in item) return { CLASIFICACION_6: item.CLASIFICACION_6, ENVASE: item.DESCRIPCION };
    }
    return {};
  });
}

function cerrarModal() {
  let elem = document.getElementById("modalFiltro");
  if (elem) {
    let instance = M.Modal.getInstance(elem);
    if (instance) instance.close();
  }
}

function LimpiarFiltroPre(opt) {
  $("#txtClasesV").val("");
  $("#txtMarcasV").val("");
  $("#txtTiposV").val("");
  $("#txtSubTiposV").val("");
  $("#txtSubTipos2V").val("");
  $("#txtEnvasesV").val("");
  $("#filtromarca").empty();
  $("#filtrotipo").empty();
  $("#filtrosubtipo").empty();
  $("#filtrosubtipo2").empty();
  $("#filtroenvase").empty();
  $("input[type='checkbox']").prop("checked", false);
  localStorage.removeItem("claseSelect");
  localStorage.removeItem("marcaSelect");
  localStorage.removeItem("tipoSelect");
  localStorage.removeItem("subtipoSelect");
  localStorage.removeItem("subtipo2Select");
  localStorage.removeItem("envaseSelect");
  clearFiltros = true;
  if (opt === 1) cerrarModal();
}

function cambiarPestana(paneId, btnClicked) {
  const navContainer = btnClicked.closest('.custom-tabs-nav');
  if (navContainer) {
    navContainer.querySelectorAll('.custom-tab-btn').forEach(btn => btn.classList.remove('active'));
  }
  btnClicked.classList.add('active');

  const vista = btnClicked.closest('.vista-wrapper');
  if (vista) {
    vista.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const targetPane = vista.querySelector(`#tabContent${paneId.charAt(0).toUpperCase() + paneId.slice(1)}`) 
                    || vista.querySelector(`#tabContent${paneId}`);
    if (targetPane) targetPane.classList.add('active');
  }
}

// Utilidades Generales
function mostrarImagen(codigo, descripcion) {
  let code;
  try {
    code = decodeURIComponent(codigo); 
  } catch (e) {
    console.error("Error decodificando código:", e);
    code = codigo; 
  }
  Swal.fire({
    confirmButtonColor: "#28a745",
    html: `
      <div>
        <h3 style="font-size: 18px; margin-bottom: 10px;">${code}</h3>
        <img src="${env.API_IMAGE}/${code.replace("/", "-")}" alt="Imagen" style="width:100%; max-width: 200px; border-radius: 8px;">
        <p style="font-size: 14px; margin-top: 10px;">${descripcion}</p>
      </div>
    `,
    customClass: { title: "img-tamaño-articulo" },
  });
}

function mostrarExistencias(p_Articulo) {
  let code;
  try {
    code = decodeURIComponent(p_Articulo); 
  } catch (e) {
    code = p_Articulo; 
  }

  Swal.fire({
    title: "Cargando Registros....",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: function () {
      Swal.showLoading();
    },
  });

  const apiUrl = env.API_URL + "wmsexistenciaarticulosporbodega/1";
  const params = `?p_Articulo=${encodeURIComponent(code)}`;

  fetch(apiUrl + params, {
    method: "GET",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("==== RESPUESTA DEL API (Existencias) ====", data);
      if (data.reporte && data.reporte.length > 0) {
        var existenciaArticulos = data.reporte; 
        var tablaHtml =
          '<table style="border-collapse: collapse; width: 100%; margin-top: 10px;">' +
          '<thead style="background: #f1f5f9;">' +
          '<tr style="border-bottom: 2px solid #cbd5e1;">' +
          '<th style="text-align: left; padding: 8px; font-size: 13px;"> Bodega </th>' +
          '<th style="text-align: center; padding: 8px; font-size: 13px;"> Cantidad </th>' +
          "</tr>" +
          "</thead>" +
          "<tbody>";

        existenciaArticulos.forEach((articulo) => {
          tablaHtml +=
            '<tr style="border-bottom: 1px solid #e2e8f0;">' +
            '<td style="text-align: left; padding: 8px; font-size: 13px;">' + articulo.NOMBRE + "</td>" +
            '<td style="text-align: center; padding: 8px; font-weight: bold; color: #0f172a;">' + parseFloat(articulo.CANTIDAD).toFixed(2) + "</td>" +
            "</tr>";
        });
        tablaHtml += "</tbody></table>";

        Swal.fire({
          title: "Existencia: " + code, 
          html: tablaHtml,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745",
        });
      } else {
        Swal.fire({
          title: "Artículo: " + code, 
          text: "Sin existencias registradas.",
          icon: "info",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745",
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al obtener los registros de existencia",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    });
}

// Filtros y Renderizados Auxiliares de Catálogo
function MostrarMarcas(opt) {
  const result = [];
  const map = new Map();
  let marcaHTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.MARCA)) {
      map.set(item.MARCA, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_2 : item.MARCA, DESCRIPCION: item.MARCA });
    }
    marcaHTML = mostrarFiltro(result, "txtMarca", opt === 1 ? 2 : undefined);
  }
  return marcaHTML;
}

function MostrarClases(opt) {
  const result = [];
  const map = new Map();
  let claseHTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.CLASE)) {
      map.set(item.CLASE, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_1 : item.CLASE, DESCRIPCION: item.CLASE });
    }
    claseHTML = mostrarFiltro(result, "txtClase", opt === 1 ? 1 : undefined);
  }
  return claseHTML;
}

function MostrarTipos(opt) {
  const result = [];
  const map = new Map();
  let tipoHTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.TIPO)) {
      map.set(item.TIPO, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_3 : item.TIPO, DESCRIPCION: item.TIPO });
    }
    tipoHTML = mostrarFiltro(result, "txtTipo", opt === 1 ? 3 : undefined);
  }
  return tipoHTML;
}

function MostrarSubTipos(opt) {
  const result = [];
  const map = new Map();
  let subtipoHTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.SUBTIPO)) {
      map.set(item.SUBTIPO, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_4 : item.SUBTIPO, DESCRIPCION: item.SUBTIPO });
    }
    subtipoHTML = mostrarFiltro(result, "txtSubTipo", opt === 1 ? 4 : undefined);
  }
  return subtipoHTML;
}

function MostrarSubTipos2(opt) {
  const result = [];
  const map = new Map();
  let subtipo2HTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.SUBTIPO2)) {
      map.set(item.SUBTIPO2, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_5 : item.SUBTIPO2, DESCRIPCION: item.SUBTIPO2 });
    }
    subtipo2HTML = mostrarFiltro(result, "txtSubTipo2", opt === 1 ? 5 : undefined);
  }
  return subtipo2HTML;
}

function MostrarEnvases(opt) {
  const result = [];
  const map = new Map();
  let envaseHTML = "";
  for (const item of ArrayData) {
    if (!map.has(item.ENVASE)) {
      map.set(item.ENVASE, true); 
      result.push({ VALOR: opt === 1 ? item.CLASIFICACION_6 : item.ENVASE, DESCRIPCION: item.ENVASE });
    }
    envaseHTML = mostrarFiltro(result, "txtEnvase", opt === 1 ? 6 : undefined);
  }
  return envaseHTML;
}

function ordenarDescripcion(data) {
  return data.sort(function (a, b) {
    if (a.DESCRIPCION > b.DESCRIPCION) return 1;
    if (a.DESCRIPCION < b.DESCRIPCION) return -1;
    return 0;
  });
}

function mostrarFiltro(data, id, opt) {
  data = ordenarDescripcion(data);
  let claseSelect = localStorage.getItem("claseSelect");
  let marcaSelect = localStorage.getItem("marcaSelect");
  let tipoSelect = localStorage.getItem("tipoSelect");
  let subtipoSelect = localStorage.getItem("subtipoSelect");

  let htm = "";
  let i = parseInt(1);
  if (data.length > 0) {
    data.forEach(function (key) {
      if (key.VALOR != null && key.DESCRIPCION != null) {
        let action = "";
        switch (opt) {
          case 1: action = `getFiltros('${key.VALOR}')`; break;
          case 2: action = `getFiltros('${claseSelect}','${key.VALOR}')`; break;
          case 3: action = `getFiltros('${claseSelect}','${marcaSelect}','${key.VALOR}')`; break;
          case 4: action = `getFiltros('${claseSelect}','${marcaSelect}','${tipoSelect}','${key.VALOR}')`; break;
          case 5: action = `getFiltros('${claseSelect}','${marcaSelect}','${tipoSelect}','${subtipoSelect}','${key.VALOR}')`; break;
          case 6: action = `guardarEnvaseSelect('${key.VALOR}')`; break;
          default: action = `getFiltro('${id}','${id + i}')`; break;
        }
        
        htm += `<label style="display:block; margin-bottom: 5px;">
                  <input type="checkbox" value="${key.VALOR}" name="${id}[]" id="${id + i}" onchange="${action}">
                  <span style="font-size: 13px;">${key.DESCRIPCION}</span>
                </label>`;
        i++;
      }
    });
    return htm;
  } else return "<label>Filtro no existe</label>";
}

function guardarEnvaseSelect(envaseSelect) {
  localStorage.setItem("envaseSelect", envaseSelect);
}

// Variables Globales Barcode
function impCodBar(p_Articulo, p_Descripcion) {
  localStorage.setItem("impCodeBar", p_Articulo);
  localStorage.setItem("descripcionImpCode", p_Descripcion);
  mostrarModalGeneradorCodigoBarras();
}

function mostrarModalGeneradorCodigoBarras() {
  const esPantallaPequena = window.matchMedia("(max-width: 600px)").matches;

  Swal.fire({
    title: "Generador de Códigos de Barras",
    width: esPantallaPequena ? "100%" : "60%",
    padding: "2em",
    showConfirmButton: false,
    showCloseButton: true,
    html: `
      <style>
        .container-barcode {
          text-align: center;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .container-barcode select, .container-barcode input {
          width: 100%;
          max-width: 300px;
          margin-bottom: 15px;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }
        #barcode { margin-top: 20px; display: flex; justify-content: center; }
      </style>            
      <div class="container-barcode">
        <label style="font-weight: bold; margin-bottom: 5px; display:block;">Simbología:</label>
        <select id="symbology" class="browser-default">
          <option value="CODE128">Código 128</option>
          <option value="QR">Código QR</option>
        </select>

        <input type="text" id="data" style="display:none;">

        <label style="font-weight: bold; margin-bottom: 5px; display:block;">Tamaño:</label>
        <select id="size" class="browser-default">
          <option value="0.75" selected>75%</option>
          <option value="1">100%</option>
          <option value="2">200%</option>
        </select>

        <div id="barcode"></div>
        <button id="printBarcode" class="btn-buscar-gradient" style="margin-top: 15px; width: auto; border-radius: 6px;">
          <i class="material-icons left">print</i>Imprimir Código
        </button>
      </div>
    `,
    didOpen: () => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = () => inicializarGenerador(); 
      document.body.appendChild(script);
    },
  });
}

function inicializarGenerador() {
  const codigo = localStorage.getItem("impCodeBar");
  const inputData = document.getElementById("data");

  if (codigo && inputData) {
    inputData.value = codigo;
    generateBarcode();
  }

  document.getElementById("symbology").addEventListener("change", generateBarcode);
  document.getElementById("size").addEventListener("change", generateBarcode);
  document.getElementById("printBarcode").addEventListener("click", imprimeCodigo);
}

function generateBarcode() {
  const symbology = document.getElementById("symbology").value;
  const data = document.getElementById("data").value;
  const size = parseFloat(document.getElementById("size").value);
  const descripcion = localStorage.getItem("descripcionImpCode"); 

  const barcodeContainer = document.getElementById("barcode");
  barcodeContainer.innerHTML = "";

  if (data.trim() === "") return;

  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";

  if (symbology === "QR") {
    const qrContainer = document.createElement("div");
    new QRCode(qrContainer, { text: data, width: 150 * size, height: 150 * size });
    wrapper.appendChild(qrContainer);
  } else if (symbology === "CODE128") {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, data, { format: symbology, width: 2 * size, height: 100 * size, displayValue: true });
    wrapper.appendChild(canvas);
  }

  if (descripcion) {
    const descElement = document.createElement("p");
    descElement.textContent = descripcion;
    descElement.style.marginTop = "10px";
    descElement.style.fontSize = "14px";
    descElement.style.fontWeight = "bold";
    wrapper.appendChild(descElement);
  }

  barcodeContainer.appendChild(wrapper);
}

function imprimeCodigo() {
  const data = document.getElementById("data").value;
  const symbology = document.getElementById("symbology").value;
  const size = parseFloat(document.getElementById("size").value);
  const descripcion = localStorage.getItem("descripcionImpCode");

  if (!data.trim()) return;

  const hoy = new Date();
  const fechaSistema = hoy.getFullYear() + "-" + 
    String(hoy.getMonth() + 1).padStart(2, '0') + "-" + 
    String(hoy.getDate()).padStart(2, '0') + " " +
    String(hoy.getHours()).padStart(2, '0') + ":" +
    String(hoy.getMinutes()).padStart(2, '0') + ":" +
    String(hoy.getSeconds()).padStart(2, '0');

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
        <head>
            <title>Imprimir Código</title>
            <style>
                @page { size: auto; margin: 0mm; }
                body { display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif; padding: 10px; }
                canvas, img { max-width: 100% !important; height: auto !important; margin: 0 auto; }
                .fecha { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
                .descripcion { font-size: 13px; margin-top: 5px; text-align: center; }
            </style>
        </head>
        <body>
            <div id="printBarcode" style="text-align: center;"></div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <script>
                function generatePrint() {
                    const printContainer = document.getElementById('printBarcode');
                    const wrapper = document.createElement('div');
                    
                    const fechaElement = document.createElement('p');
                    fechaElement.className = 'fecha';
                    fechaElement.textContent = "Fecha: ${fechaSistema}";
                    wrapper.appendChild(fechaElement);
                    
                    if ("${symbology}" === 'QR') {
                        const qrContainer = document.createElement('div');
                        new QRCode(qrContainer, { text: "${data}", width: 150 * ${size}, height: 150 * ${size} });
                        wrapper.appendChild(qrContainer);
                    } else {
                        const canvas = document.createElement('canvas');
                        JsBarcode(canvas, "${data}", { format: "${symbology}", width: 2 * ${size}, height: 100 * ${size}, displayValue: true });
                        wrapper.appendChild(canvas);
                    }

                    if ("${descripcion || ""}") {
                        const descElement = document.createElement('p');
                        descElement.className = 'descripcion';
                        descElement.textContent = "${descripcion || ""}";
                        wrapper.appendChild(descElement);
                    }
                    printContainer.appendChild(wrapper);
                }
                generatePrint();
                window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

function information(codeArticulo, descripcion) {
  let pUsuario = document.getElementById("hUsuario")?.value || "";
  const params = "?pUsuario=" + pUsuario + "&pCodigo=" + codeArticulo;

  fetch(env.API_URL + "detallearticulo" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("==== RESPUESTA DEL API (Información Artículo) ====", result);
      if (result.msg === "SUCCESS" && result.resultado.length !== 0) {
        Swal.fire({
          title: "Artículo: " + codeArticulo,
          html: `
            <div style="text-align: left; font-size: 13.5px; line-height: 1.5;">
              <strong>Descripción:</strong> ${descripcion}<br><br>
              El color <span style="color:#ef4444; font-weight:bold;">rojo</span> indica existencias por debajo del punto de reorden.<br>
              El color <span style="color:#16a34a; font-weight:bold;">verde</span> indica que el punto de reorden es estable.<br><br>
              <h5 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">DETALLE TÉCNICO</h5>
              <p style="text-align: justify; background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${result.resultado[0].NOTAS}</p>
            </div>
          `,
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#28a745",
        });
      }
    });
}
// // =============================================================================
// // CONTROL DE INSTANCIA ÚNICA (BLOQUEO DE MÚLTIPLES PESTAÑAS)
// // =============================================================================
// (function iniciarControlPestanaUnica() {
//   const LOCK_KEY = "WMS_ACTIVE_TAB_LOCK";
//   const CHANNEL_NAME = "wms_single_tab_channel";
//   const HEARTBEAT_INTERVAL = 1500;
//   const TIMEOUT_TOLERANCE = 3500; // Tiempo para considerar que el líder murió

//   // 1. Identificador único por pestaña (sessionStorage se preserva en F5 pero NO entre pestañas nuevas)
//   if (!sessionStorage.getItem("WMS_TAB_ID")) {
//     sessionStorage.setItem("WMS_TAB_ID", "tab_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9));
//   }
//   const MI_TAB_ID = sessionStorage.getItem("WMS_TAB_ID");

//   let canal = null;
//   if (typeof BroadcastChannel !== "undefined") {
//     canal = new BroadcastChannel(CHANNEL_NAME);
//   }

//   let heartbeatTimer = null;
//   let bloqueado = false;

//   function renderizarPantallaBloqueo() {
//     if (bloqueado) return;
//     bloqueado = true;

//     if (heartbeatTimer) clearInterval(heartbeatTimer);
//     if (canal) canal.close();

//     console.warn("⚠️ Pestaña duplicada detectada. Bloqueando vista...");
//     try { window.stop(); } catch (e) {}

//     const aplicarHtml = () => {
//       document.body.innerHTML = `
//         <div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:20px; box-sizing:border-box;">
//           <div style="background:#ffffff; border-radius:12px; padding:32px 24px; max-width:440px; width:100%; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #cbd5e1;">
//             <div style="font-size:48px; color:#dc2626; line-height:1; margin-bottom:12px;">⚠️</div>
//             <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin:0 0 10px 0;">Sesión Activa en Otra Pestaña</h2>
//             <p style="font-size:13.5px; color:#64748b; line-height:1.5; margin:0 0 16px 0;">
//               El sistema WMS no permite operar con múltiples pestañas simultáneas para evitar inconsistencias en parámetros de búsqueda, conteos y existencias.
//             </p>
//             <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px; margin-bottom:20px;">
//               <span style="font-size:12px; font-weight:600; color:#991b1b;">
//                 Cierre esta pestaña y continúe en la ventana principal.
//               </span>
//             </div>
//             <button type="button" onclick="window.close()" style="width:100%; height:40px; border-radius:6px; border:none; background:#1b676b; color:#ffffff; font-size:14px; font-weight:600; cursor:pointer;">
//               Cerrar esta pestaña
//             </button>
//           </div>
//         </div>
//       `;
//     };

//     if (document.body) {
//       aplicarHtml();
//     } else {
//       document.addEventListener("DOMContentLoaded", aplicarHtml);
//     }
//   }

//   function actualizarHeartbeat() {
//     localStorage.setItem(LOCK_KEY, JSON.stringify({
//       tabId: MI_TAB_ID,
//       timestamp: Date.now()
//     }));
//   }

//   // 2. Verificar existencia de un líder previo
//   const lockDataRaw = localStorage.getItem(LOCK_KEY);
//   const ahora = Date.now();

//   if (lockDataRaw) {
//     try {
//       const lockData = JSON.parse(lockDataRaw);
//       // Si hay un líder diferente y su pulso sigue vivo, nos bloqueamos de inmediato
//       if (lockData.tabId && lockData.tabId !== MI_TAB_ID && (ahora - lockData.timestamp < TIMEOUT_TOLERANCE)) {
//         renderizarPantallaBloqueo();
//         return;
//       }
//     } catch (e) {
//       localStorage.removeItem(LOCK_KEY);
//     }
//   }

//   // 3. Si no hay líder o somos nosotros mismos tras recargar (F5), tomamos liderazgo
//   actualizarHeartbeat();
//   heartbeatTimer = setInterval(actualizarHeartbeat, HEARTBEAT_INTERVAL);

//   // 4. Canal de comunicación activo en tiempo real
//   if (canal) {
//     // Escuchar solicitudes de otras pestañas
//     canal.onmessage = function (e) {
//       const msg = e.data;
//       if (!msg) return;

//       // Si otra pestaña avisa que se abrió y nosotros somos el líder activo, le respondemos que se bloquee
//       if (msg.type === "NUEVA_PESTANA_ABIERTA" && msg.tabId !== MI_TAB_ID) {
//         canal.postMessage({ type: "LIDER_PRESENTE", tabId: MI_TAB_ID });
//       }

//       // Si alguien más reclama ser líder y su heartbeat en localStorage es legítimo
//       if (msg.type === "LIDER_PRESENTE" && msg.tabId !== MI_TAB_ID) {
//         const lockCheck = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}");
//         if (lockCheck.tabId === msg.tabId) {
//           renderizarPantallaBloqueo();
//         }
//       }
//     };

//     // Anunciar apertura
//     canal.postMessage({ type: "NUEVA_PESTANA_ABIERTA", tabId: MI_TAB_ID });
//   }

//   // 5. Escuchar evento storage por si la pestaña entra en suspensión o pierde liderazgo
//   window.addEventListener("storage", function (e) {
//     if (e.key === LOCK_KEY && e.newValue) {
//       try {
//         const data = JSON.parse(e.newValue);
//         if (data.tabId && data.tabId !== MI_TAB_ID) {
//           // Otra pestaña tomó el lock de forma válida
//           renderizarPantallaBloqueo();
//         }
//       } catch (err) {}
//     }
//   });

//   // 6. Al cerrar la ventana NO borramos con removeItem (evita carreras en F5),
//   // simplemente dejamos que el timeout de 3.5s expire si la pestaña se cerró definitivamente.
//   window.addEventListener("pagehide", function () {
//     if (heartbeatTimer) clearInterval(heartbeatTimer);
//     if (canal) canal.close();
//   });
// })();
// // =============================================================================
// // FUNCIONES DE MAIN
// // =============================================================================
// var ArrayData = new Array();
// var ArrayData2 = new Array();
// var ArrayDataFiltrado = new Array();

// var ArrayPrecio = new Array();
// var promo = "";
// var viewImcompletos = false;
// var clearFiltros = false;
// var xPag = 20;
// var itemsToDelete = "";
// var itemsToDelete_NoProm = "";
// var promoToDelete = "";
// let acumToDelete = JSON.parse(sessionStorage.getItem("itemsToDelete"));

// document.addEventListener("DOMContentLoaded", function () {
//   console.log("DOM cargado...");
//   cargarJsBarcode();
//   validate_login();
//   existeBodega();

//   localStorage.setItem("sinExistencias", "false");
//   const checkbox = document.getElementById("sinExistencias");
//   if (checkbox) {
//     checkbox.addEventListener("change", () => {
//       localStorage.setItem("sinExistencias", checkbox.checked ? "true" : "false");
//     });
//   }

//   // INICIALIZACIÓN GLOBAL DE FECHAS (MATERIALIZE DATEPICKER)
//   const elemsDate = document.querySelectorAll('.datepicker');
//   if (elemsDate.length > 0) {
//     M.Datepicker.init(elemsDate, {
//       format: 'yyyy-mm-dd',
//       autoClose: true,
//       showClearBtn: true,
//       defaultDate: new Date(), // Establece la fecha del sistema como predeterminada
//       setDefaultDate: true,    // Fuerza a que el input se llene visualmente con esta fecha
//       i18n: {
//         cancel: 'Cancelar',
//         clear: 'Limpiar',
//         done: 'Ok',
//         months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
//         monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
//         weekdays: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
//         weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
//         weekdaysAbbrev: ["D", "L", "M", "M", "J", "V", "S"]
//       }
//     });
//   }
// });

// function cargarJsBarcode() {
//   if (!document.getElementById("jsbarcode-cdn")) {
//     const script = document.createElement("script");
//     script.id = "jsbarcode-cdn";
//     script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js";
//     script.async = true;
//     document.head.appendChild(script);
//   }
// }

// function validate_login() {
//   const user = sessionStorage.getItem("user");
//   if (user) {
//     const usuario = existe_Usuario();
//     const userEl = document.getElementById("usuario");
//     const hUserEl = document.getElementById("hUsuario");
//     if (userEl) userEl.innerHTML = usuario;
//     if (hUserEl) hUserEl.value = usuario;
//   } else {
//     window.location = "index.html";
//   }
// }

// function existe_Usuario() {
//   const usuario = sessionStorage.getItem("user");
//   return JSON.parse(usuario) || [];
// }

// function existeBodega() {
//   const bodegaStorage = sessionStorage.getItem("bodega");
//   if (!bodegaStorage) return;

//   try {
//     const bodega = JSON.parse(bodegaStorage);
//     if (Array.isArray(bodega) && bodega.length > 0) {
//       const lblSucursal = document.getElementById("bodega-sucursal");
//       const inputBodega = document.getElementById("bodega");
//       if (lblSucursal) lblSucursal.innerHTML = bodega[0].NOMBRE;
//       if (inputBodega) inputBodega.value = bodega[0].BODEGA;
//     }
//   } catch (e) {
//     console.error("Error al leer bodega de sessionStorage:", e);
//   }
// }

// async function abrirSelectorBodegas() {
//   const usuario = existe_Usuario();
//   if (!usuario || usuario.length === 0) {
//     Swal.fire({
//       icon: "warning",
//       title: "Sesión no válida",
//       text: "Por favor inicie sesión nuevamente.",
//       confirmButtonColor: "#28a745"
//     });
//     return;
//   }

//   // Mostrar spinner de carga de tiendas
//   Swal.fire({
//     title: "Cargando sucursales...",
//     allowOutsideClick: false,
//     showConfirmButton: false,
//     didOpen: () => {
//       Swal.showLoading();
//     }
//   });

//   try {
//     const response = await fetch(env.API_URL + "Tiendas?user=" + encodeURIComponent(usuario), {
//       method: "GET",
//       cache: "no-cache",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//     });

//     const result = await response.json();

//     if (result.msg === "SUCCESS" && Array.isArray(result.tiendas) && result.tiendas.length > 0) {
//       // Mapear bodegas a un diccionario para el select de SweetAlert2
//       const inputOptions = {};
//       const mapaNombres = {};
//       const bodegaActual = document.getElementById("bodega")?.value || "";

//       result.tiendas.forEach((item) => {
//         inputOptions[item.BODEGA] = `${item.BODEGA} - ${item.NOMBRE}`;
//         mapaNombres[item.BODEGA] = item.NOMBRE;
//       });

//       // Mostrar el diálogo selector
//       const { value: bodegaSeleccionada } = await Swal.fire({
//         title: "Seleccionar Bodega o Sucursal",
//         input: "select",
//         inputOptions: inputOptions,
//         inputValue: bodegaActual,
//         inputPlaceholder: "Elija una sucursal...",
//         showCancelButton: true,
//         cancelButtonText: "Cancelar",
//         confirmButtonText: "Cambiar sucursal",
//         confirmButtonColor: "#28a745",
//         cancelButtonColor: "#6e7881",
//         inputValidator: (value) => {
//           if (!value) {
//             return "Debe seleccionar una bodega";
//           }
//         },
//       });

//       if (bodegaSeleccionada) {
//         const nombreTienda = mapaNombres[bodegaSeleccionada] || bodegaSeleccionada;
//         sucursalbremen(nombreTienda, bodegaSeleccionada);
//       }
//     } else {
//       Swal.fire({
//         icon: "info",
//         title: "Sin sucursales",
//         text: "No se encontraron sucursales asignadas para este usuario.",
//         confirmButtonColor: "#28a745",
//       });
//     }
//   } catch (error) {
//     console.error("Error cargando sucursales:", error);
//     Swal.fire({
//       icon: "error",
//       title: "Error de conexión",
//       text: "No se pudieron obtener las sucursales disponibles.",
//       confirmButtonColor: "#d33",
//     });
//   }
// }

// function sucursalbremen(tienda, id_tienda) {
//   console.log("Tienda seleccionada: " + tienda + " (ID: " + id_tienda + ")");

//   const lblSucursal = document.getElementById("bodega-sucursal");
//   const inputBodega = document.getElementById("bodega");

//   if (lblSucursal) lblSucursal.innerHTML = tienda;
//   if (inputBodega) {
//     inputBodega.value = id_tienda;
//     // Disparar evento change manual por si la vista activa está escuchando
//     inputBodega.dispatchEvent(new Event("change"));
//   }

//   // Persistir en sessionStorage manteniendo el perfil actual si existe
//   let perfilActual = "OPERADOR";
//   try {
//     const bodegaGuardada = JSON.parse(sessionStorage.getItem("bodega"));
//     if (Array.isArray(bodegaGuardada) && bodegaGuardada[0]?.PERFIL) {
//       perfilActual = bodegaGuardada[0].PERFIL;
//     }
//   } catch (e) {}

//   const newbodega = [
//     {
//       BODEGA: id_tienda,
//       NOMBRE: tienda,
//       PERFIL: perfilActual,
//     },
//   ];
//   sessionStorage.setItem("bodega", JSON.stringify(newbodega));

//   // Notificación de confirmación breve
//   const Toast = Swal.mixin({
//     toast: true,
//     position: "top-end",
//     showConfirmButton: false,
//     timer: 1800,
//     timerProgressBar: true,
//   });

//   Toast.fire({
//     icon: "success",
//     title: `Sucursal activa: ${tienda}`,
//   });

//   // Ejecutar callbacks dependientes si existen en la vista activa (como fechasDeInventario)
//   if (typeof fechasDeInventario === "function") {
//     fechasDeInventario();
//   }
//   if (typeof limpiarResultadoGeneral === "function") {
//     limpiarResultadoGeneral();
//   }
// }

// // Nota: La función final y segura window.logout se aloja ahora en encabezado.js para inyección directa en el Custom Element.

// function enlace(link) {
//   if (link && link !== "#") {
//     window.location.href = link;
//   }
// }

// function filtrosModal() {
//   let htm = "";
//   let elem = document.getElementById("modalFiltro");
//   if (!elem) return;

//   let instance = M.Modal.getInstance(elem) || M.Modal.init(elem);
//   instance.open();

//   localStorage.removeItem("claseSelect");
//   htm = ` <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>CLASE</div>
//                 <div class="collapsible-body">
//                   <div id="filtroclase" style="padding-left: 10px"></div>
//                     <input type="hidden" value="" id="txtClaseV" name="txtClaseV">
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>MARCA</div>
//                 <div class="collapsible-body">
//                     <div id="filtromarca" style="padding-left: 10px"></div>
//                       <input type="hidden" value="" id="txtMarcaV" name="txtMarcaV" >
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>TIPO</div>
//                 <div class="collapsible-body">
//                     <div id="filtrotipo" style="padding-left: 10px"></div>
//                       <input type="hidden" value="" id="txtTipo" name="txtTipo" >
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>SUBTIPO</div>
//                 <div class="collapsible-body">
//                     <div id="filtrosubtipo" style="padding-left: 10px"></div>
//                       <input type="hidden" value="" id="txtSubtipo" name="txtSubtipo" >
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>SUBTIPO2</div>
//                 <div class="collapsible-body">
//                     <div id="filtrosubtipo2" style="padding-left: 10px"></div>
//                       <input type="hidden" value="" id="txtSubtipo2" name="txtSubtipo2" >
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s12">
//             <ul class="collapsible">
//               <li>
//                 <div class="collapsible-header"><i class="material-icons">add</i>ENVASE</div>
//                 <div class="collapsible-body">
//                     <div id="filtroenvase" style="padding-left: 10px"></div>
//                       <input type="hidden" value="" id="txtEnvase" name="txtEnvase" >
//                 </div>
//               </li>
//             </ul>
//           </div>
//         </div>
//         <div class="row">
//           <div class="col s6">
//             <a onclick="preBusqueda();" class="btn btn-filtros-result">
//               <i class="material-icons left">check</i> Aceptar
//             </a>
//           </div>
//           <div class="col s6">
//             <a onclick="LimpiarFiltroPre();" class="btn btn-filtros-result">
//               <i class="material-icons left">update</i> Limpiar
//             </a>
//           </div>
//         </div>`;

//   document.getElementById("divFiltro").innerHTML = htm;

//   getFiltros()
//     .then(() => {
//       document.getElementById("filtroclase").innerHTML = MostrarClases(1);
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });

//   $(".collapsible").collapsible();
// }

// function getFiltros(clase = "", marca = "", tipo = "", subtipo = "", subtipo2 = "", envase = "") {
//   const params = `?clase=${encodeURIComponent(clase)}&marca=${encodeURIComponent(marca)}&tipo=${encodeURIComponent(tipo)}&subtipo=${encodeURIComponent(subtipo)}&subtipo2=${encodeURIComponent(subtipo2)}&envase=${encodeURIComponent(envase)}`;

//   return fetch(env.API_URL + "filtroswms" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
//         ArrayData = formatData(result.filtros);

//         if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_2"))) {
//           localStorage.setItem("claseSelect", clase);
//           document.getElementById("filtromarca").innerHTML = MostrarMarcas(1);
//         } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_3"))) {
//           localStorage.setItem("marcaSelect", marca);
//           document.getElementById("filtrotipo").innerHTML = MostrarTipos(1);
//         } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_4"))) {
//           localStorage.setItem("tipoSelect", tipo);
//           document.getElementById("filtrosubtipo").innerHTML = MostrarSubTipos(1);
//         } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_5"))) {
//           localStorage.setItem("subtipoSelect", subtipo);
//           document.getElementById("filtrosubtipo2").innerHTML = MostrarSubTipos2(1);
//         } else if (ArrayData.some((item) => item.hasOwnProperty("CLASIFICACION_6"))) {
//           localStorage.setItem("subtipo2Select", subtipo2);
//           document.getElementById("filtroenvase").innerHTML = MostrarEnvases(1);
//         }
//       }
//     });
// }

// function formatData(data) {
//   return data.map((item) => {
//     if ("DESCRIPCION" in item) {
//       if ("CLASIFICACION_1" in item) return { CLASIFICACION_1: item.CLASIFICACION_1, CLASE: item.DESCRIPCION };
//       if ("CLASIFICACION_2" in item) return { CLASIFICACION_2: item.CLASIFICACION_2, MARCA: item.DESCRIPCION };
//       if ("CLASIFICACION_3" in item) return { CLASIFICACION_3: item.CLASIFICACION_3, TIPO: item.DESCRIPCION };
//       if ("CLASIFICACION_4" in item) return { CLASIFICACION_4: item.CLASIFICACION_4, SUBTIPO: item.DESCRIPCION };
//       if ("CLASIFICACION_5" in item) return { CLASIFICACION_5: item.CLASIFICACION_5, SUBTIPO2: item.DESCRIPCION };
//       if ("CLASIFICACION_6" in item) return { CLASIFICACION_6: item.CLASIFICACION_6, ENVASE: item.DESCRIPCION };
//     }
//     return {};
//   });
// }

// function cerrarModal() {
//   let elem = document.getElementById("modalFiltro");
//   if (elem) {
//     let instance = M.Modal.getInstance(elem);
//     if (instance) instance.close();
//   }
// }

// $("#articulo").on("keypress", function (e) {
//   if (e.keyCode === 13 || e.keyCode === 9) {
//     e.preventDefault();
//     preBusqueda();
//   }
// });

// $(document).ready(function () {
//   $(".sidenav").sidenav();
//   $(".tabs").tabs();
//   $(".collapsible").collapsible();
//   $(".modal").modal();
//   $("select").formSelect();
//   $(".dropdown-trigger").dropdown();
// });

// // function preBusqueda() {
// //   let pag = 1;
// //   let articulo = document.getElementById("articulo")?.value.trim() || "";
// //   const art = encodeURIComponent(articulo);
// //   let bodega = document.getElementById("bodega")?.value || "";
// //   let clase = localStorage.getItem("claseSelect") || "";
// //   let marca = localStorage.getItem("marcaSelect") || "";
// //   let tipo = localStorage.getItem("tipoSelect") || "";
// //   let envase = localStorage.getItem("envaseSelect") || "";

// //   const checkbox = document.getElementById("sinExistencias");
// //   const existenciaBusqueda = checkbox?.checked ? "N" : "S";

// //   const params = `?pActivos=S&pExistencia=${existenciaBusqueda}&pArticulo=${art}&pClase=${clase}&pMarca=${marca}&pUso=${tipo}&pEnvase=${envase}&pBodega=${bodega}&pTipoBodega=0`;

// //   if (typeof mostrarLoader === "function") mostrarLoader("Buscando artículos...");

// //   fetch(env.API_URL + "wmsbusquedaarticulos/1" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (typeof ocultarLoader === "function") ocultarLoader();

// //             // Dentro de la función preBusqueda() en main.js:
// //             if (result && result.msg === "SUCCESS") {
// //               if (result.data && result.data.length > 0) {
// //                 ArrayData = result.data;
// //                 ArrayDataFiltrado = result.data;
// //                 ArrayData2 = result.data;
// //                 localStorage.setItem("articulo-Busqueda", JSON.stringify(ArrayData));

// //                 let totales = ArrayDataFiltrado.length;
// //                 let nPag = Math.ceil(totales / xPag);
// //                 LimpiarFiltroPre(1);

// //                 // Validación defensiva obligatoria
// //                 if (typeof mostrarResultadosBusqueda === "function") {
// //                   mostrarResultadosBusqueda(nPag, pag);
// //                 } else {
// //                   console.warn("La vista actual no soporta el renderizado de catálogo de artículos.");
// //                 }
                
// //                 if (typeof ocultarLoader === "function") ocultarLoader();
// //               } else {
// //                 Swal.fire({
// //                   icon: "info",
// //                   title: "Información",
// //                   text: "No hay resultado para la búsqueda: " + articulo,
// //                   confirmButtonColor: "#28a745",
// //                 });
// //                 if (typeof ocultarLoader === "function") ocultarLoader();
// //                 LimpiarFiltroPre(1);
// //               }
// //             }
// //     })
// //     .catch((error) => {
// //       if (typeof ocultarLoader === "function") ocultarLoader();
// //       console.error("Error en búsqueda:", error);
// //     });
// // }

// //-----------------BUSQUEDA REGULAR -------------------------------------------------
// function preBusqueda() {
//   let pag = 1;
//   let articulo = document.getElementById("articulo")?.value.trim() || "";
//   const art = encodeURIComponent(articulo);
//   let bodega = document.getElementById("bodega")?.value || "";
//   let clase = localStorage.getItem("claseSelect") || "";
//   let marca = localStorage.getItem("marcaSelect") || "";
//   let tipo = localStorage.getItem("tipoSelect") || "";
//   let envase = localStorage.getItem("envaseSelect") || "";

//   const checkbox = document.getElementById("sinExistencias");
//   const existenciaBusqueda = checkbox?.checked ? "N" : "S";

//   const params = `?pActivos=S&pExistencia=${existenciaBusqueda}&pArticulo=${art}&pClase=${clase}&pMarca=${marca}&pUso=${tipo}&pEnvase=${envase}&pBodega=${bodega}&pTipoBodega=0`;

//   if (typeof mostrarLoader === "function") mostrarLoader("Buscando artículos...");

//   fetch(env.API_URL + "wmsbusquedaarticulos/1" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (typeof ocultarLoader === "function") ocultarLoader();

//       if (result && result.msg === "SUCCESS") {
//         if (result.data && result.data.length > 0) {
//           ArrayData = result.data;
//           ArrayDataFiltrado = result.data;
//           ArrayData2 = result.data;
//           localStorage.setItem("articulo-Busqueda", JSON.stringify(ArrayData));

//           let totales = ArrayDataFiltrado.length;
//           let nPag = Math.ceil(totales / xPag);
//           LimpiarFiltroPre(1);

//           mostrarResultadosBusqueda(nPag, pag);
//         } else {
//           Swal.fire({
//             icon: "info",
//             title: "Información",
//             text: "No hay resultado para la búsqueda: " + articulo,
//             confirmButtonColor: "#28a745",
//           });
//           LimpiarFiltroPre(1);
//         }
//       } else {
//          Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Error al consultar el servicio.",
//             confirmButtonColor: "#d33",
//           });
//       }
//     })
//     .catch((error) => {
//       if (typeof ocultarLoader === "function") ocultarLoader();
//       console.error("Error en búsqueda:", error);
//     });
// }

// //-----------------------------------------------------------------------------------
// // MANEJO DEL CONTENEDOR DINÁMICO DE BÚSQUEDA
// //-----------------------------------------------------------------------------------
// function inyectarYMostrarBuscador(htm) {
//   let resContainer = document.getElementById("resultadoBusqueda");
  
//   // 1. Si no existe el contenedor, lo creamos dinámicamente dentro de <main>
//   if (!resContainer) {
//     resContainer = document.createElement("div");
//     resContainer.id = "resultadoBusqueda";
//     resContainer.className = "vista-wrapper"; 
    
//     const mainEl = document.querySelector("main");
//     if (mainEl) {
//       mainEl.appendChild(resContainer);
//     } else {
//       document.body.appendChild(resContainer);
//     }
//   }

//   // 2. Ocultar las otras vistas operativas para que el buscador se superponga limpiamente
//   document.querySelectorAll(".vista-wrapper").forEach(vw => {
//     if(vw.id !== "resultadoBusqueda") {
//       vw.style.display = "none";
//     }
//   });

//   // 3. Mostrar contenedor e inyectar resultados
//   resContainer.style.display = "block";
//   resContainer.innerHTML = htm;

//   // 4. Scroll Top suave
//   $("html, body").animate({ scrollTop: 0 }, 500);

//   // 5. Reinicializar Materialize Selects (si aplica)
//   if (typeof M !== "undefined") {
//     if (M.FormSelect) M.FormSelect.init(resContainer.querySelectorAll("select"));
//     if (M.Dropdown) M.Dropdown.init(resContainer.querySelectorAll(".dropdown-trigger"));
//   }
// }

// // RESTAURAR LA VISTA ORIGINAL
// window.cerrarBusquedaGlobal = function() {
//   const resContainer = document.getElementById("resultadoBusqueda");
//   if (resContainer) {
//     resContainer.style.display = "none";
//     resContainer.innerHTML = "";
//   }
  
//   // Mostrar nuevamente las vistas operativas
//   document.querySelectorAll(".vista-wrapper").forEach(vw => {
//     if(vw.id !== "resultadoBusqueda") {
//       vw.style.display = ""; // Restaura el display CSS original
//     }
//   });

//   // Limpiar input
//   const artInput = document.getElementById("articulo");
//   if(artInput) artInput.value = "";
// };

// //-----------------------------------------------------------------------------------
// function mostrarResultadosBusqueda(nPag, pag) {
//   let htm = "";
//   let desde = (pag - 1) * xPag;
//   let hasta = Math.min(pag * xPag, ArrayDataFiltrado.length);

//   if (desde >= ArrayDataFiltrado.length) {
//     desde = 0;
//     hasta = Math.min(xPag, ArrayDataFiltrado.length);
//     pag = 1;
//   }

//   htm = mostrarResultados(desde, hasta);
//   htm += paginador(nPag, pag);
  
//   inyectarYMostrarBuscador(htm);
// }

// //-----------------------------------------------------------------------------------
// function mostrarResultados(desde, hasta) {
//   let htm = "";
//   let bodegaLabel = "";
//   let url = "";

//   // Botón para cerrar la búsqueda y volver a la vista actual
//   htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
//             <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
//               <i class="material-icons">close</i>
//               <span>Cerrar Búsqueda</span>
//             </button>
//           </div>`;

//   htm += '<div id="lista-articulo">';
//   htm += `<div class="col s12">
//             <h1 class="titulo-principal">RESULTADOS DE LA BÚSQUEDA</h1>
//           </div>`;

//   htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">        
//           <div class="col s6 valign-wrapper">
//             <label>
//               <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
//               <span>Mostrar En Bodega</span>
//             </label>
//           </div>
//           <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
//             <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
//             <span style="font-size: 16px; color: var(--primary-teal);">${ArrayDataFiltrado.length}</span>
//           </div>
//         </div>
        
//         <div class="row" id="vistabusqueda" style="display: flex; gap: 10px;">
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px;" onclick="cambiarVistaLista();">
//               <i class="material-icons left">list</i> VISTA LISTA
//             </button>
//           </div>
//           <div class="col s6" style="padding: 0;">
//             <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b;" onclick="FiltrarModal();">
//               <i class="material-icons left">filter_list</i> FILTRAR
//             </button>
//           </div>
//         </div>`;

//   htm += '<div class="grid-container">'; 

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       let DArticulo = ArrayDataFiltrado[i].ARTICULO.replace("/", "-");
//       const cantBodega = parseFloat(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA) || 0;

//       bodegaLabel = cantBodega > 0 ? `<span class="mi-tienda">En Bodega</span>` : `<span></span>`;
//       url = `href="#"`;

//       let colorReorden = "";
//       if (ArrayDataFiltrado[i].color === "R") colorReorden = "red accent-4";
//       else if (ArrayDataFiltrado[i].color === "A") colorReorden = "light-blue darken-1";
//       else if (ArrayDataFiltrado[i].color === "N") colorReorden = "deep-orange accent-3";
//       else if (ArrayDataFiltrado[i].color === "V") colorReorden = "green darken-1";

//       htm += `<div class="container-img">
//                  <div id="envoltorio">
//                <a ${url}>                
//                  <img src="${env.API_IMAGE}/${DArticulo}" width="100%" alt="${ArrayDataFiltrado[i].ARTICULO}">
//                   ${bodegaLabel}
//                </a>
//                <div class="flotante-acciones ${colorReorden}">
//                   <div class="link-flotante-acciones-forklift">
//                    <a onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">
//                      <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22">
//                    </a>             
//                  </div>
//                   <div class="link-flotante-acciones-bar-code">
//                    <a onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                    <img src="./img/icon/bar-code.svg" width="22" height="22">
//                    </a>             
//                  </div>
//                     <div class="link-flotante-acciones-information">
//                    <a onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                    <img src="./img/icon/information.svg" width="22" height="22">
//                    </a>             
//                  </div>
//                </div>          
//              </div>
//           <h3 class="articulo-titulo">Nombre: ${ArrayDataFiltrado[i].ARTICULO}</h3>
//           <h4>Descripción: ${ArrayDataFiltrado[i].DESCRIPCION}</h4>
//           <h4>Cantidad: ${cantBodega.toFixed(2)}</h4>
//         </div>`;
//     }
//   }
//   htm += "</div>"; 
//   htm += "</div>"; 
//   return htm;
// }

// //-----------------------------------------------------------------------------------
// function cambiarVistaMosaico() {
//   let totales = ArrayDataFiltrado.length;
//   let nPag = Math.ceil(totales / xPag);
//   mostrarResultadosBusqueda(nPag, 1);
// }

// //-----------------------------------------------------------------------------------
// function cambiarVistaLista() {
//   const bodega = JSON.parse(sessionStorage.getItem("bodega"));
//   let bodegaCod = bodega[0].BODEGA;
//   let totalRegistros = ArrayDataFiltrado.length;
//   let pag = 1; 
//   let desde = (pag - 1) * xPag;
//   let hasta = Math.min(pag * xPag, totalRegistros);
//   let nPag = Math.ceil(totalRegistros / xPag);
//   let htm = "";

//   htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
//             <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
//               <i class="material-icons">close</i>
//               <span>Cerrar Búsqueda</span>
//             </button>
//           </div>`;

//   htm += '<div id="lista-articulo">';
//   htm += `<div class="col s12">
//           <h1 class="titulo-principal">RESULTADOS DE LA BÚSQUEDA</h1>
//           </div>`;

//   htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">          
//             <div class="col s6 valign-wrapper">
//               <label>
//                 <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
//                 <span>Mostrar En Bodega</span>
//               </label>
//             </div>
//             <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
//               <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
//               <span style="font-size: 16px; color: var(--primary-teal);">${totalRegistros}</span>
//             </div>
//           </div>
//           <div class="row" style="display: flex; gap: 10px;">
//             <div class="col s6" style="padding: 0;">
//                 <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px;" onclick="cambiarVistaMosaico();">
//               <i class="material-icons left">apps</i> VISTA MOSAICO </button>
//             </div>
//             <div class="col s6" style="padding: 0;">
//               <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b;" onclick="FiltrarModal();">
//               <i class="material-icons left">filter_list</i> FILTRAR </button>
//             </div>
//           </div>`;

//   htm += `<div class="grid-table-responsive" style="margin-top: 20px;">
//             <table class="tabla-transacciones">
//             <thead>
//               <tr>
//                 <th style="width:30%; text-align: left;">Código / Desc.</th>
//                 <th style="width:30%;">Código de Barras</th>
//                 <th style="width:10%;">En ${bodegaCod}</th>
//                 <th style="width:30%;">Opc.</th>
//               </tr>
//             </thead>
//             <tbody>`;

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       htm += `<tr>`;
//       htm += `<td style="text-align: left;">
//                 <div class="cell-articulo-box">
//                   <span class="cell-articulo-code" style="color: var(--articulo-orange);">${ArrayDataFiltrado[i].ARTICULO}</span>
//                   <span class="cell-articulo-desc">${ArrayDataFiltrado[i].DESCRIPCION}</span>
//                 </div>
//               </td>
//               <td class="cell-center">${ArrayDataFiltrado[i].CODIGO_BARRAS_INVT ? ArrayDataFiltrado[i].CODIGO_BARRAS_INVT : ""}</td>
//               <td class="cell-number">${Math.floor(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA)}</td>
//               <td class="cell-center">
//                 <i class="material-symbols-outlined" style="cursor: pointer; color: #64748b; margin: 0 4px;" onclick="mostrarImagen('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}', '${ArrayDataFiltrado[i].DESCRIPCION}')">visibility</i>              
//                 <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">                
//                 <img src="./img/icon/bar-code.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                 <img src="./img/icon/information.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//               </td>`;
//       htm += `</tr>`;
//     }
//   }

//   htm += `</tbody></table></div>`;

//   htm += `<div id="resultadoPaginador" style="margin-top: 20px;">`;
//   htm += paginadorTablas(nPag, pag, "mostrarResultadosVistaLista");
//   htm += `</div></div>`;

//   inyectarYMostrarBuscador(htm);
// }

// function mostrarResultadosVistaLista(nPag, pag) {
//   let htm = "";
//   let desde = (pag - 1) * xPag;
//   let hasta = pag * xPag;

//   htm = resultadosVistaLista(desde, hasta);
//   htm += `<div id="resultadoPaginador" style="margin-top: 20px;">`;
//   htm += paginadorTablas(nPag, pag, "mostrarResultadosVistaLista");
//   htm += `</div>`;
  
//   inyectarYMostrarBuscador(htm);
// }

// function resultadosVistaLista(desde, hasta) {
//   const bodega = JSON.parse(sessionStorage.getItem("bodega"));
//   let bodegaCod = bodega[0].BODEGA;
//   let totalRegistros = ArrayDataFiltrado.length;
//   let htm = "";

//   htm += `<div class="top-action-bar" style="margin-bottom: 15px;">
//             <button type="button" class="btn btn-volver" onclick="cerrarBusquedaGlobal()">
//               <i class="material-icons">close</i>
//               <span>Cerrar Búsqueda</span>
//             </button>
//           </div>`;

//   htm += '<div id="lista-articulo">';
//   htm += `<div class="col s12">
//           <h1 class="titulo-principal">RESULTADOS DE LA BÚSQUEDA</h1>
//           </div>`;

//   htm += `<div class="row" id="totalregistrosBusqueda" style="margin-bottom: 20px;">           
//              <div class="col s6 valign-wrapper">
//               <label>
//                 <input type="checkbox" id="miCheckbox" onchange="toggleMostrarEnBodega()">
//                 <span>Mostrar En Bodega</span>
//               </label>
//             </div>
//              <div class="col s6 valign-wrapper" style="justify-content: flex-end;">
//               <span style="font-weight: bold; margin-right: 5px;">Total de Registros: </span>
//               <span style="font-size: 16px; color: var(--primary-teal);">${totalRegistros}</span>
//             </div>
//           </div>
//           <div class="row" style="display: flex; gap: 10px;">
//             <div class="col s6" style="padding: 0;">
//                 <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px;" onclick="cambiarVistaMosaico(${desde},${hasta});">
//               <i class="material-icons left">apps</i> VISTA MOSAICO </button>
//             </div>
//             <div class="col s6" style="padding: 0;">
//               <button class="btn-buscar-gradient" style="width: 100%; border-radius: 8px; background: #64748b;" onclick="FiltrarModal();">
//               <i class="material-icons left">filter_list</i> FILTRAR </button>
//             </div>
//           </div>`;

//   htm += `<div class="grid-table-responsive" style="margin-top: 20px;">
//             <table class="tabla-transacciones">
//             <thead>
//               <tr>
//                 <th style="width:30%; text-align: left;">Código / Desc.</th>
//                 <th style="width:30%;">Código de Barras</th>
//                 <th style="width:10%;">En ${bodegaCod}</th>
//                 <th style="width:30%;">Acción</th>
//               </tr>
//             </thead>
//             <tbody>`;

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       htm += `<tr>`;
//       htm += `<td style="text-align: left;">
//                 <div class="cell-articulo-box">
//                   <span class="cell-articulo-code" style="color: var(--articulo-orange);">${ArrayDataFiltrado[i].ARTICULO}</span>
//                   <span class="cell-articulo-desc">${ArrayDataFiltrado[i].DESCRIPCION}</span>
//                 </div>
//               </td>
//               <td class="cell-center">${ArrayDataFiltrado[i].CODIGO_BARRAS_INVT ? ArrayDataFiltrado[i].CODIGO_BARRAS_INVT : ""}</td>
//               <td class="cell-number">${Math.floor(ArrayDataFiltrado[i].TOTAL_CANTIDAD_BODEGA)}</td>
//               <td class="cell-center">
//                 <i class="material-symbols-outlined" style="cursor: pointer; color: #64748b; margin: 0 4px;" onclick="mostrarImagen('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}', '${ArrayDataFiltrado[i].DESCRIPCION}')">visibility</i>              
//                 <img src="./img/icon/forklift-1-svgrepo-com.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="mostrarExistencias('${encodeURIComponent(ArrayDataFiltrado[i].ARTICULO)}')">
//                 <img src="./img/icon/bar-code.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="impCodBar('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//                 <img src="./img/icon/information.svg" width="22" height="22" style="cursor: pointer; margin: 0 4px;" onclick="information('${ArrayDataFiltrado[i].ARTICULO}','${ArrayDataFiltrado[i].DESCRIPCION}')">
//               </td>`; 
//       htm += `</tr>`;
//     }
//   }

//   htm += `</tbody></table></div></div>`;
//   return htm;
// }

// function LimpiarFiltroPre(opt) {
//   $("#txtClasesV").val("");
//   $("#txtMarcasV").val("");
//   $("#txtTiposV").val("");
//   $("#txtSubTiposV").val("");
//   $("#txtSubTipos2V").val("");
//   $("#txtEnvasesV").val("");
//   $("#filtromarca").empty();
//   $("#filtrotipo").empty();
//   $("#filtrosubtipo").empty();
//   $("#filtrosubtipo2").empty();
//   $("#filtroenvase").empty();
//   $("input[type='checkbox']").prop("checked", false);
//   localStorage.removeItem("claseSelect");
//   localStorage.removeItem("marcaSelect");
//   localStorage.removeItem("tipoSelect");
//   localStorage.removeItem("subtipoSelect");
//   localStorage.removeItem("subtipo2Select");
//   localStorage.removeItem("envaseSelect");
//   clearFiltros = true;
//   if (opt === 1) cerrarModal();
// }

// function cambiarPestana(paneId, btnClicked) {
//   const navContainer = btnClicked.closest('.custom-tabs-nav');
//   if (navContainer) {
//     navContainer.querySelectorAll('.custom-tab-btn').forEach(btn => btn.classList.remove('active'));
//   }
//   btnClicked.classList.add('active');

//   const vista = btnClicked.closest('.vista-wrapper');
//   if (vista) {
//     vista.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
//     const targetPane = vista.querySelector(`#tabContent${paneId.charAt(0).toUpperCase() + paneId.slice(1)}`) 
//                     || vista.querySelector(`#tabContent${paneId}`);
//     if (targetPane) targetPane.classList.add('active');
//   }
// }