let barChartInstance = null;
let pieChartInstance = null;

document.addEventListener("DOMContentLoaded", function () {
  // Limpiar rastros locales si es necesario
  localStorage.removeItem("swalMessageShown");
  
  // Inicializar componentes Materialize (Dropdowns)
  const elems = document.querySelectorAll(".dropdown-trigger");
  M.Dropdown.init(elems, { coverTrigger: false, constrainWidth: false });
  
  // Carga inicial del Dashboard por defecto
  getDataDash();
});

function getDataDash() {
  const usuario = document.getElementById("hUsuario").value.replace(/"/g, "");
  const params = "?pUsuario=" + encodeURIComponent(usuario);

  // Actualizar los títulos para el contexto de Pedidos
  document.getElementById("lbl_kpi_1").innerText = "Pedidos Solicitados";
  document.getElementById("titulo_grafica_barras").innerText = "Artículos Solicitados y Pendientes según clase";
  document.getElementById("titulo_grafica_anillo").innerText = "Distribución de Artículos Solicitados";

  mostrarLoader("Cargando indicadores...");

  fetch(env.API_URL + "wmsgetdashinfo/1" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.data && result.data.length > 0) {
          const arr = result.data[0];
          actualizarKPIs(arr.PEDIDOS_SOLICITADOS, arr.CANT_ARTICULOS_SOLICITADOS, arr.CANT_ARTICULOS_PENDIENTES, arr.ARTICULOS_CON_PRIORIDAD);
          generarGraficas(params); // Llama a la segunda ruta para las gráficas
        } else {
          actualizarKPIs(0, 0, 0, 0);
          mostrarDatosSimulados();
          mostrarAlertaVacio();
        }
      } else {
        actualizarKPIs(0, 0, 0, 0);
        mostrarDatosSimulados();
      }
    })
    .catch((error) => {
      console.error("Error obteniendo KPIs de Pedidos:", error);
      actualizarKPIs(0, 0, 0, 0);
      mostrarDatosSimulados();
    })
    .finally(() => {
      ocultarLoader();
    });
}

function getDataDashOC() {
  const usuario = document.getElementById("hUsuario").value.replace(/"/g, "");
  const params = "?pUsuario=" + encodeURIComponent(usuario);

  // Actualizar los títulos para el contexto de Órdenes de Compra
  document.getElementById("lbl_kpi_1").innerText = "O/C Solicitadas";
  document.getElementById("titulo_grafica_barras").innerText = "Artículos Solicitados y Pendientes en O/C";
  document.getElementById("titulo_grafica_anillo").innerText = "Distribución de Artículos en O/C";

  mostrarLoader("Cargando indicadores de Compras...");

  fetch(env.API_URL + "wmsgetdashinfo/1" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.data && result.data.length > 0) {
          const arr = result.data[0];
          actualizarKPIs(arr.PEDIDOS_SOLICITADOS, arr.CANT_ARTICULOS_SOLICITADOS, arr.CANT_ARTICULOS_PENDIENTES, arr.ARTICULOS_CON_PRIORIDAD);
          generarGraficas(params);
        } else {
          actualizarKPIs(0, 0, 0, 0);
          mostrarDatosSimulados();
          mostrarAlertaVacio();
        }
      } else {
        actualizarKPIs(0, 0, 0, 0);
        mostrarDatosSimulados();
      }
    })
    .catch((error) => {
      console.error("Error obteniendo KPIs de OC:", error);
      actualizarKPIs(0, 0, 0, 0);
      mostrarDatosSimulados();
    })
    .finally(() => {
      ocultarLoader();
    });
}

function actualizarKPIs(pedidos, articulosSol, articulosPend, prioridad) {
  document.getElementById("pedidos_solicitados").innerText = parseFloat(pedidos || 0).toFixed(0);
  document.getElementById("articulos_solicitados").innerText = parseFloat(articulosSol || 0).toFixed(0);
  document.getElementById("articulos_pendientes").innerText = parseFloat(articulosPend || 0).toFixed(0);
  document.getElementById("articulos_prioridad").innerText = parseFloat(prioridad || 0).toFixed(0);
}

function mostrarAlertaVacio() {
  if (!localStorage.getItem("swalMessageShown")) {
    Swal.fire({
      icon: "info",
      title: "Tablero sin operaciones",
      text: "La información mostrada en las gráficas es de carácter demostrativo, debido a que en estos momentos no tiene operaciones pendientes asignadas.",
      confirmButtonColor: "#28a745",
    });
    localStorage.setItem("swalMessageShown", true);
  }
}

function generarGraficas(paramsConfig) {
  fetch(env.API_URL + "wmsgetdashinfo/2" + paramsConfig, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.data && result.data.length > 0) {
        dibujarGraficas(result.data);
      } else {
        mostrarDatosSimulados();
      }
    })
    .catch((error) => {
      console.error("Error obteniendo datos de gráficas:", error);
      mostrarDatosSimulados();
    });
}

function dibujarGraficas(dataArray) {
  // Extraer información
  const labelsDesc = dataArray.map((item) => item.DESCRIPCION);
  const dataSolicitados = dataArray.map((item) => parseFloat(item.CANT_ARTICULOS_SOLICITADOS || 0));
  const dataPendientes = dataArray.map((item) => Math.abs(parseFloat(item.CANT_ARTICULOS_PENDIENTES || 0)));

  // Destruir instancias previas si existen (Evita superposición de canvas)
  if (barChartInstance) barChartInstance.destroy();
  if (pieChartInstance) pieChartInstance.destroy();

  // 1. Renderizar Gráfica de Barras
  const ctxBar = document.getElementById("myChart").getContext("2d");
  barChartInstance = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: labelsDesc,
      datasets: [
        {
          label: "Artículos Solicitados",
          data: dataSolicitados,
          backgroundColor: "#1b676b", // Teal corporativo
          borderRadius: 4,
        },
        {
          label: "Artículos Pendientes",
          data: dataPendientes,
          backgroundColor: "#fd7e14", // Naranja para alertas
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: "#e2e8f0" } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { position: "top" }
      }
    },
  });

  // 2. Renderizar Gráfica de Anillo (Doughnut)
  const ctxPie = document.getElementById("myPieChart").getContext("2d");
  
  // Generar paleta de colores dinámicos pero sobrios
  const coloresDoughnut = labelsDesc.map((_, i) => {
    const hue = (i * 137.508) % 360; // Distribución dorada
    return `hsl(${hue}, 60%, 50%)`;
  });

  pieChartInstance = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: labelsDesc,
      datasets: [
        {
          data: dataSolicitados,
          backgroundColor: coloresDoughnut,
          borderWidth: 2,
          borderColor: "#ffffff"
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%", // Hueco del anillo
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` ${context.label}: ${context.raw.toFixed(0)} unid.`;
            },
          },
        },
      },
    },
  });
}

function mostrarDatosSimulados() {
  const mockData = [
    { DESCRIPCION: "Lubricantes", CANT_ARTICULOS_SOLICITADOS: 150, CANT_ARTICULOS_PENDIENTES: 30 },
    { DESCRIPCION: "Llantas", CANT_ARTICULOS_SOLICITADOS: 85, CANT_ARTICULOS_PENDIENTES: 15 },
    { DESCRIPCION: "Filtros", CANT_ARTICULOS_SOLICITADOS: 210, CANT_ARTICULOS_PENDIENTES: 40 },
    { DESCRIPCION: "Baterías", CANT_ARTICULOS_SOLICITADOS: 45, CANT_ARTICULOS_PENDIENTES: 5 },
  ];
  dibujarGraficas(mockData);
}

// ============================================================================
// CÓDIGO COMENTADO Y PRESERVADO PARA USO FUTURO (MAPAS Y OTRAS GRÁFICAS)
// ============================================================================
/*
function initMapaPanama() {
    const mapContainer = document.getElementById('mapPanama');
    if (!mapContainer) return;
    const map = L.map('mapPanama').setView([8.538, -80.782], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    const bodegas = [ ... ];
    bodegas.forEach(b => { ... });
}

function renderizarDashboardWMS() {
    // 1. Gráfica de Barras: Estado de Pedidos (Pendiente, En Picking, Empacado, Despachado)
    new Chart(document.getElementById('chartStatus'), { ... });
    // 2. Gráfica de Dona: Ocupación de Bodega por Tipo de Producto o Zona
    new Chart(document.getElementById('chartZonas'), { ... });
    // 3. Gráfica Lineal: Productividad de Preparación (Picking vs Packing)
    new Chart(document.getElementById("chartProductividad"), { ... });
}
*/