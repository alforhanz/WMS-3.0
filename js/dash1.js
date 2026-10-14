let datosCompletos = [];
let mapInstance = null;
let chartStatusInstance = null;
let chartZonasInstance = null;
let chartProductividadInstance = null;
let chartRadarInstance = null;
let chartTransaccionesInstance = null;
let chartRacksInstance = null;

// Configuración Global para Chart.js
Chart.defaults.color = '#64748b';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const bodegasPanama = [
  { id: "BR-TM", nombre: "Bremen - Tumba Muerto", coords: [9.0251, -79.5226], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=10079881889526052492" },
  { id: "BR-C50", nombre: "Bremen - Calle 50", coords: [8.9885, -79.5127], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=1277513250532887642" },
  { id: "BR-24D", nombre: "Bremen - 24 de Diciembre", coords: [9.1013, -79.3854], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=11913408935496564016" },
  { id: "BR-DAV", nombre: "Bremen - David", coords: [8.4238, -82.4323], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=14462542309345647693" },
  { id: "BR-CHI", nombre: "Bremen - Chitré", coords: [7.9600, -80.4297], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=13706581016572968707" },
  { id: "BR-SAN", nombre: "Bremen - Santiago", coords: [8.1046, -80.9701], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=14334376120144714680" },
  { id: "BR-PEN", nombre: "Bremen - Penonomé", coords: [8.5144, -80.3589], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=10742304592685314903" },
  { id: "CEDI-01", nombre: "CEDI Norwing - Pueblo Nuevo", coords: [9.019268, -79.5131725], tipo: "CEDI", gmaps: "https://www.google.com/maps/search/?api=1&query=9.019268,-79.5131725" },
  { id: "NW-PC", nombre: "Norwing - Plaza Carolina", coords: [9.0278, -79.4798], tipo: "Norwing", gmaps: "https://maps.google.com/?cid=1291211260969938617" },
  { id: "NW-DAV", nombre: "Norwing - David (San Mateo)", coords: [8.4287, -82.4351], tipo: "Norwing", gmaps: "https://maps.google.com/?cid=7297405406566993614" }
];

document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard Operativo cargado...");

  // Activar loader durante la carga inicial
  if (typeof mostrarLoader === "function") {
    mostrarLoader("Cargando métricas y gráficos del dashboard...");
  }

  setTimeout(() => {
    try {
      renderizarDashboardWMS();
      initMapaPanama();
    } catch (err) {
      console.error("Error al renderizar el dashboard:", err);
    } finally {
      if (typeof ocultarLoader === "function") {
        ocultarLoader();
      }
    }
  }, 300);

  // Escuchar cambio de bodega desde el header
  const inputBodega = document.getElementById("bodega");
  if (inputBodega) {
    inputBodega.addEventListener("change", function () {
      actualizarDashboard(this.value);
    });
  }
});

function renderizarDashboardWMS() {
  // 1. Estado de Pedidos (Barra Vertical)
  const ctxStatus = document.getElementById("chartStatus");
  if (ctxStatus) {
    chartStatusInstance = new Chart(ctxStatus, {
      type: "bar",
      data: {
        labels: ["Pendiente", "Facturados", "Taller", "Despachado"],
        datasets: [{
          label: "Cantidad",
          data: [450, 320, 280, 890],
          backgroundColor: ["#0284c7", "#0d9488", "#eab308", "#16a34a"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "#f1f5f9" } }
        }
      }
    });
  }

  // 2. Ocupación por Zona (Dona)
  const ctxZonas = document.getElementById("chartZonas");
  if (ctxZonas) {
    chartZonasInstance = new Chart(ctxZonas, {
      type: "doughnut",
      data: {
        labels: ["Rack A (Llantas)", "Rack B (Aceites)", "Rines", "Filtros"],
        datasets: [{
          data: [40, 15, 25, 20],
          backgroundColor: ["#1b676b", "#0284c7", "#f59e0b", "#f97316"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } }
        }
      }
    });
  }

  // 3. Preparación vs Pendiente (Línea)
  const ctxProd = document.getElementById("chartProductividad");
  if (ctxProd) {
    chartProductividadInstance = new Chart(ctxProd, {
      type: "line",
      data: {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        datasets: [
          {
            label: "Picking",
            data: [120, 250, 180, 300, 450, 200],
            borderColor: "#0284c7",
            backgroundColor: "rgba(2, 132, 199, 0.1)",
            tension: 0.35,
            fill: true
          },
          {
            label: "Pendientes",
            data: [80, 210, 150, 260, 400, 350],
            borderColor: "#ea580c",
            backgroundColor: "rgba(234, 88, 12, 0.05)",
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "#f1f5f9" } }
        }
      }
    });
  }

  // 4. Eficiencia de Despacho (Radar)
  const ctxRadar = document.getElementById("eficienciaPicking");
  if (ctxRadar) {
    chartRadarInstance = new Chart(ctxRadar, {
      type: "radar",
      data: {
        labels: ["Velocidad", "Exactitud", "Packing", "Despacho", "Seguridad"],
        datasets: [
          {
            label: "CEDI",
            data: [95, 90, 85, 92, 98],
            backgroundColor: "rgba(27, 103, 107, 0.25)",
            borderColor: "#1b676b",
            pointBackgroundColor: "#1b676b"
          },
          {
            label: "Sucursales",
            data: [75, 85, 70, 80, 90],
            backgroundColor: "rgba(2, 132, 199, 0.2)",
            borderColor: "#0284c7",
            pointBackgroundColor: "#0284c7"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
        scales: {
          r: {
            angleLines: { color: "#e2e8f0" },
            grid: { color: "#f1f5f9" },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // 5. Transacciones WMS (Barra Horizontal Apilada)
  const ctxArt = document.getElementById("chartArticulos");
  if (ctxArt) {
    chartTransaccionesInstance = new Chart(ctxArt, {
      type: "bar",
      data: {
        labels: ["Pedidos", "Traslados", "Órdenes Compra"],
        datasets: [
          {
            label: "Finalizados",
            data: [62, 70, 45],
            backgroundColor: "#16a34a",
            borderRadius: 4
          },
          {
            label: "Pendientes",
            data: [18, 25, 12],
            backgroundColor: "#dc2626",
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { color: "#f1f5f9" } },
          y: { stacked: true, grid: { display: false } }
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } }
        }
      }
    });
  }

  // 6. Niveles por Rack (Polar Area)
  const ctxRacks = document.getElementById("chartContenedores");
  if (ctxRacks) {
    chartRacksInstance = new Chart(ctxRacks, {
      type: "polarArea",
      data: {
        labels: ["Rack A", "Rack B", "Rines", "Filtros", "Baterías"],
        datasets: [{
          data: [80, 45, 90, 60, 30],
          backgroundColor: [
            "rgba(27, 103, 107, 0.7)",
            "rgba(2, 132, 199, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(249, 115, 22, 0.7)",
            "rgba(220, 38, 38, 0.7)"
          ],
          borderWidth: 1,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
        scales: {
          r: { grid: { color: "#f1f5f9" }, ticks: { display: false } }
        }
      }
    });
  }
}

function initMapaPanama() {
  const mapContainer = document.getElementById("mapPanama");
  if (!mapContainer) return;

  // Centro aproximado de Panamá con zoom adecuado
  mapInstance = L.map("mapPanama").setView([8.538, -80.782], 7);

  // Capa libre y gratuita de OpenStreetMap (sin API Key)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance);

  bodegasPanama.forEach((b) => {
    const esCEDI = b.tipo === "CEDI";
    const marker = L.circleMarker(b.coords, {
      radius: esCEDI ? 10 : 7,
      fillColor: esCEDI ? "#ea580c" : "#1b676b",
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(mapInstance);

    marker.bindPopup(`
      <div style="font-family: inherit; min-width: 190px; color: #1e293b;">
        <strong style="font-size: 13px; color: #1b676b;">${b.nombre}</strong><br>
        <span style="color: #64748b; font-size: 11px;">ID WMS: <b>${b.id}</b></span>
        <hr style="margin: 8px 0; border: 0; border-top: 1px solid #e2e8f0;">
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;"><span>📦 Pedidos:</span><b>200</b></div>
          <div style="display: flex; justify-content: space-between; color: #16a34a;"><span>✅ Finalizados:</span><b>50</b></div>
          <div style="display: flex; justify-content: space-between; color: #dc2626;"><span>⏳ Pendientes:</span><b>150</b></div>
        </div>
        <a href="${b.gmaps}" target="_blank" style="display: block; margin-top: 10px; padding: 6px; background: #0284c7; color: white; text-align: center; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 11px;">
          ABRIR EN MAPS
        </a>
      </div>
    `);
  });

  // Reajuste del tamaño para evitar cortes al terminar la carga
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 350);
}

function actualizarDashboard(idBodega) {
  console.log("Filtrando dashboard para bodega:", idBodega);

  if (typeof mostrarLoader === "function") {
    mostrarLoader("Actualizando métricas para la sucursal...");
  }

  setTimeout(() => {
    try {
      const infoBodega = bodegasPanama.find((b) => b.id.includes(idBodega) || b.nombre.includes(idBodega));
      if (infoBodega && mapInstance) {
        mapInstance.flyTo(infoBodega.coords, 14, { animate: true, duration: 1.2 });
      }

      const randomTotal = Math.floor(Math.random() * 400) + 120;
      const randomPendiente = Math.floor(randomTotal * 0.25);

      const kpiPed = document.getElementById("kpi_pedidos");
      const kpiItems = document.getElementById("kpi_items");
      const kpiPend = document.getElementById("kpi_pendientes");

      if (kpiPed) kpiPed.innerText = randomTotal;
      if (kpiItems) kpiItems.innerText = (randomTotal * 11.8).toFixed(0);
      if (kpiPend) kpiPend.innerText = randomPendiente;

      if (chartStatusInstance) {
        chartStatusInstance.data.datasets[0].data = [
          randomPendiente,
          Math.floor(randomTotal * 0.35),
          Math.floor(randomTotal * 0.15),
          randomTotal - randomPendiente
        ];
        chartStatusInstance.update();
      }

      if (chartZonasInstance) {
        chartZonasInstance.data.datasets[0].data = [
          Math.floor(Math.random() * 40) + 10,
          Math.floor(Math.random() * 30) + 10,
          Math.floor(Math.random() * 30) + 10,
          Math.floor(Math.random() * 30) + 10
        ];
        chartZonasInstance.update();
      }
    } catch (err) {
      console.error("Error al actualizar datos de bodega:", err);
    } finally {
      if (typeof ocultarLoader === "function") {
        ocultarLoader();
      }
    }
  }, 400);
}