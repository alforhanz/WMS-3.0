// =============================================================================
// CONTROL DE INSTANCIA ÚNICA (BLOQUEO DE MÚLTIPLES PESTAÑAS)
// =============================================================================
(function iniciarControlPestanaUnica() {
  const LOCK_KEY = "WMS_ACTIVE_TAB_LOCK";
  const CHANNEL_NAME = "wms_single_tab_channel";
  const HEARTBEAT_INTERVAL = 1500;
  const TIMEOUT_TOLERANCE = 3500; // Tiempo para considerar que el líder murió

  // 1. Identificador único por pestaña (sessionStorage se preserva en F5 pero NO entre pestañas nuevas)
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

  // 2. Verificar existencia de un líder previo
  const lockDataRaw = localStorage.getItem(LOCK_KEY);
  const ahora = Date.now();

  if (lockDataRaw) {
    try {
      const lockData = JSON.parse(lockDataRaw);
      // Si hay un líder diferente y su pulso sigue vivo, nos bloqueamos de inmediato
      if (lockData.tabId && lockData.tabId !== MI_TAB_ID && (ahora - lockData.timestamp < TIMEOUT_TOLERANCE)) {
        renderizarPantallaBloqueo();
        return;
      }
    } catch (e) {
      localStorage.removeItem(LOCK_KEY);
    }
  }

  // 3. Si no hay líder o somos nosotros mismos tras recargar (F5), tomamos liderazgo
  actualizarHeartbeat();
  heartbeatTimer = setInterval(actualizarHeartbeat, HEARTBEAT_INTERVAL);

  // 4. Canal de comunicación activo en tiempo real
  if (canal) {
    // Escuchar solicitudes de otras pestañas
    canal.onmessage = function (e) {
      const msg = e.data;
      if (!msg) return;

      // Si otra pestaña avisa que se abrió y nosotros somos el líder activo, le respondemos que se bloquee
      if (msg.type === "NUEVA_PESTANA_ABIERTA" && msg.tabId !== MI_TAB_ID) {
        canal.postMessage({ type: "LIDER_PRESENTE", tabId: MI_TAB_ID });
      }

      // Si alguien más reclama ser líder y su heartbeat en localStorage es legítimo
      if (msg.type === "LIDER_PRESENTE" && msg.tabId !== MI_TAB_ID) {
        const lockCheck = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}");
        if (lockCheck.tabId === msg.tabId) {
          renderizarPantallaBloqueo();
        }
      }
    };

    // Anunciar apertura
    canal.postMessage({ type: "NUEVA_PESTANA_ABIERTA", tabId: MI_TAB_ID });
  }

  // 5. Escuchar evento storage por si la pestaña entra en suspensión o pierde liderazgo
  window.addEventListener("storage", function (e) {
    if (e.key === LOCK_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data.tabId && data.tabId !== MI_TAB_ID) {
          // Otra pestaña tomó el lock de forma válida
          renderizarPantallaBloqueo();
        }
      } catch (err) {}
    }
  });

  // 6. Al cerrar la ventana NO borramos con removeItem (evita carreras en F5),
  // simplemente dejamos que el timeout de 3.5s expire si la pestaña se cerró definitivamente.
  window.addEventListener("pagehide", function () {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (canal) canal.close();
  });
})();
// =============================================================================
// FUNCIONES DE MAIN
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

  // INICIALIZACIÓN GLOBAL DE FECHAS (MATERIALIZE DATEPICKER)
  const elemsDate = document.querySelectorAll('.datepicker');
  if (elemsDate.length > 0) {
    M.Datepicker.init(elemsDate, {
      format: 'yyyy-mm-dd',
      autoClose: true,
      showClearBtn: true,
      defaultDate: new Date(), // Establece la fecha del sistema como predeterminada
      setDefaultDate: true,    // Fuerza a que el input se llene visualmente con esta fecha
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

  // Mostrar spinner de carga de tiendas
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

    if (result.msg === "SUCCESS" && Array.isArray(result.tiendas) && result.tiendas.length > 0) {
      // Mapear bodegas a un diccionario para el select de SweetAlert2
      const inputOptions = {};
      const mapaNombres = {};
      const bodegaActual = document.getElementById("bodega")?.value || "";

      result.tiendas.forEach((item) => {
        inputOptions[item.BODEGA] = `${item.BODEGA} - ${item.NOMBRE}`;
        mapaNombres[item.BODEGA] = item.NOMBRE;
      });

      // Mostrar el diálogo selector
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
    // Disparar evento change manual por si la vista activa está escuchando
    inputBodega.dispatchEvent(new Event("change"));
  }

  // Persistir en sessionStorage manteniendo el perfil actual si existe
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

  // Notificación de confirmación breve
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

  // Ejecutar callbacks dependientes si existen en la vista activa (como fechasDeInventario)
  if (typeof fechasDeInventario === "function") {
    fechasDeInventario();
  }
  if (typeof limpiarResultadoGeneral === "function") {
    limpiarResultadoGeneral();
  }
}

// Nota: La función final y segura window.logout se aloja ahora en encabezado.js para inyección directa en el Custom Element.

function enlace(link) {
  if (link && link !== "#") {
    window.location.href = link;
  }
}

function filtrosModal() {
  let htm = "";
  let elem = document.getElementById("modalFiltro");
  if (!elem) return;

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
        <div class="row">
          <div class="col s6">
            <a onclick="preBusqueda();" class="btn btn-filtros-result">
              <i class="material-icons left">check</i> Aceptar
            </a>
          </div>
          <div class="col s6">
            <a onclick="LimpiarFiltroPre();" class="btn btn-filtros-result">
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

  $(".collapsible").collapsible();
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

$("#articulo").on("keypress", function (e) {
  if (e.keyCode === 13 || e.keyCode === 9) {
    e.preventDefault();
    preBusqueda();
  }
});

$(document).ready(function () {
  $(".sidenav").sidenav();
  $(".tabs").tabs();
  $(".collapsible").collapsible();
  $(".modal").modal();
  $("select").formSelect();
  $(".dropdown-trigger").dropdown();
});

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

      if (result && result.msg === "SUCCESS" && result.data?.length > 0) {
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
          text: "No hay resultados para la búsqueda: " + articulo,
          confirmButtonColor: "#28a745",
        });
        LimpiarFiltroPre(1);
      }
    })
    .catch((error) => {
      if (typeof ocultarLoader === "function") ocultarLoader();
      console.error("Error en búsqueda:", error);
    });
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