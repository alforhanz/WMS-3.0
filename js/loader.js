/**
 * loader.js
 * Inyección dinámica y control global del Loader estilo WMS
 */

(function () {
  // 1. Inyectar estilos CSS dinámicamente si no existen
  const estiloId = "wms-loader-styles";
  if (!document.getElementById(estiloId)) {
    const css = `
      #contenedorLoader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: none;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
      }

      #contenedorLoader.activo {
        display: flex !important;
      }

      .loader-card {
        background: #ffffff;
        padding: 32px 42px;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        min-width: 320px;
        max-width: 90vw;
        text-align: center;
        animation: scaleUpLoader 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .loader-spinner-custom {
        width: 56px;
        height: 56px;
        border: 5px solid #e2e8f0;
        border-top-color: #1b676b;
        border-right-color: #246d79;
        border-radius: 50%;
        animation: spinLoader 0.8s cubic-bezier(0.6, 0.05, 0.4, 1) infinite;
      }

      .loader-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: 0.3px;
        margin: 0;
      }

      .loader-subtitle {
        font-size: 0.88rem;
        color: #64748b;
        margin: 0;
        line-height: 1.4;
      }

      @keyframes spinLoader {
        to { transform: rotate(360deg); }
      }

      @keyframes scaleUpLoader {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    const styleTag = document.createElement("style");
    styleTag.id = estiloId;
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
  }

  // 2. Inyectar la estructura HTML en el DOM al cargar el documento
  function asegurarLoaderEnDOM() {
    let contenedor = document.getElementById("contenedorLoader");
    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = "contenedorLoader";
      document.body.appendChild(contenedor);
    }
    // Asegurar estructura interna
    if (!contenedor.querySelector(".loader-card")) {
      contenedor.innerHTML = `
        <div class="loader-card">
          <div class="loader-spinner-custom"></div>
          <h4 id="loaderTexto" class="loader-title">Ejecutando consulta...</h4>
          <p id="loaderSubtexto" class="loader-subtitle">Por favor espere mientras se obtienen los datos del servidor</p>
        </div>
      `;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", asegurarLoaderEnDOM);
  } else {
    asegurarLoaderEnDOM();
  }
})();

//-----------------------------------------------------------------------------
// FUNCIONES PÚBLICAS GLOBALES
//-----------------------------------------------------------------------------

/**
 * Muestra el overlay de carga con soporte para título y subtítulo dinámico.
 * Compatible con la llamada tradicional mostrarLoader() sin parámetros.
 */
function mostrarLoader(mensaje, subtexto) {
  let contenedor = document.getElementById("contenedorLoader");

  // Si se llama antes de que termine el DOMContentLoaded, crear contenedor de inmediato
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedorLoader";
    contenedor.innerHTML = `
      <div class="loader-card">
        <div class="loader-spinner-custom"></div>
        <h4 id="loaderTexto" class="loader-title">Ejecutando consulta...</h4>
        <p id="loaderSubtexto" class="loader-subtitle">Por favor espere mientras se obtienen los datos del servidor</p>
      </div>
    `;
    document.body.appendChild(contenedor);
  }

  const txt = document.getElementById("loaderTexto");
  const sub = document.getElementById("loaderSubtexto");

  if (txt) txt.textContent = mensaje || "Ejecutando consulta...";
  if (sub && subtexto) sub.textContent = subtexto;

  contenedor.classList.add("activo");
  contenedor.style.display = "flex";

  // Deshabilita el botón de búsqueda si existe en la vista activa
  const btnBuscar = document.getElementById("btnBuscar");
  if (btnBuscar) {
    btnBuscar.disabled = true;
    btnBuscar.style.opacity = "0.65";
    btnBuscar.style.cursor = "wait";
  }
}

/**
 * Oculta el overlay de carga y restablece los botones deshabilitados.
 */
function ocultarLoader() {
  const contenedor = document.getElementById("contenedorLoader");
  if (contenedor) {
    contenedor.classList.remove("activo");
    contenedor.style.display = "none";
  }

  const btnBuscar = document.getElementById("btnBuscar");
  if (btnBuscar) {
    btnBuscar.disabled = false;
    btnBuscar.style.opacity = "";
    btnBuscar.style.cursor = "";
  }
}

// function mostrarLoader() {
//   document.getElementById("contenedorLoader").innerHTML = '<div class="loading"></div>';
// }

// function ocultarLoader() {
//   const loaderContainer = document.getElementById("contenedorLoader");
//   if (loaderContainer) {
//       loaderContainer.innerHTML = '';
//   }
// }