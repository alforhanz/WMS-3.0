// Configuración Global para estilo DARK en Chart.js
Chart.defaults.color = '#8b949e'; // Color de texto
Chart.defaults.borderColor = '#30363d'; // Color de líneas de división

document.addEventListener("DOMContentLoaded", function () {
    localStorage.clear();
    $(".dropdown-trigger").dropdown();
    //getDataDash();
    cargarBodegas();
});

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("select_bodegas");
      if (data.respuesta && Array.isArray(data.respuesta)) {
        // Limpiar las opciones existentes
        bodegasSelect.innerHTML =
          '<option value="" disabled selected>Seleccione una bodega</option>';

        // Agregar opciones nuevas
        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = bodega.NOMBRE;
          bodegasSelect.appendChild(option);
        });

        // Re-inicializar el select para aplicar los cambios
        M.FormSelect.init(bodegasSelect);
      } else {
        console.error("No se encontraron bodegas.");
      }
    })
    .catch((error) => console.error("Error al cargar las bodegas:", error));
}
// Escuchar el cambio de bodega para filtrar el Dashboard
document.getElementById("select_bodegas").addEventListener('change', function() {
    const bodegaSeleccionada = this.value;
    console.log("Filtrando datos para: " + bodegaSeleccionada);
    // Aquí llamarías a tu función de actualización de datos: 
    actualizarDashboard(bodegaSeleccionada);
});
// ... Mantener funciones similares para OC llamando a mostrarGraficas con títulos personalizados

Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = '#30363d';
document.addEventListener("DOMContentLoaded", function () {
                M.AutoInit();
                cargarBodegas();
                renderizarDashboardWMS();
                });

/**
 * @function renderizarDashboardWMS
 * @description Renderiza cada segmento del dashboard y las graficas. 
 */
function renderizarDashboardWMS() {
    // 1. Gráfica de Barras: Estado de Pedidos (Pendiente, En Picking, Empacado, Despachado)
    new Chart(document.getElementById('chartStatus'), {
        type: 'bar',
        data: {
            labels: ['Pendiente', 'Facturados', 'Orden de Taller', 'Despachado'],
            datasets: [{
                label: 'Cantidad de Pedidos',
                data: [450, 320, 280, 890],
                backgroundColor: '#00ced1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    // 2. Gráfica de Dona: Ocupación de Bodega por Tipo de Producto o Zona
    new Chart(document.getElementById('chartZonas'), {
        type: 'pie',
        data: {
            labels: ['Rack A (Llantas)', 'Rack B (Aceites)', 'Rines', 'Filtros'],
            datasets: [{
                data: [40, 15, 25, 20],
                backgroundColor: ['#008080', '#2a9d8f', '#e9c46a', '#f4a261'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            //cutout: '75%',
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // 3. Gráfica Lineal: Productividad de Preparación (Picking vs Packing)
    new Chart(document.getElementById("chartProductividad"), {
      type: "line",
      data: {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
        datasets: [
          {
            label: "Picking Contenedores",
            data: [120, 250, 180, 300, 450, 200],
            borderColor: "#00ced1",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Contenedores Pendientes",
            data: [80, 210, 150, 260, 400, 350],
            borderColor: "#f07167",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });


    // 4. Avance de pedidos (Horizontal)
new Chart(document.getElementById("chartArticulos"), {
  type: "bar",
  data: {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    datasets: [
      {
        label: "Finalizados",
        data: [120, 150, 180, 90, 200],
        backgroundColor: "#00ced1", // Teal
      },
      {
        label: "Pendientes",
        data: [30, 40, 10, 50, 20],
        backgroundColor: "#f07167", // Rojo/Naranja
      },
    ],
  },
  options: {
    indexAxis: 'y', // <--- ESTA ES LA CLAVE PARA EL MODO HORIZONTAL
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        stacked: true, 
        grid: { color: "#30363d" }, 
        ticks: { color: "#fff" } 
      },
      y: { 
        stacked: true, 
        grid: { display: false }, // Quitamos la rejilla vertical para que se vea más limpio
        ticks: { color: "#fff" } 
      },
    },
    plugins: {
      legend: { 
        position: 'top', 
        labels: { color: "#fff" } 
      },
    },
  },
});
    // //4. Avance de pedidos
    // new Chart(document.getElementById("chartArticulos"), {
    //   type: "bar",
    //   data: {
    //     labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    //     datasets: [
    //       {
    //         label: "Finalizados",
    //         data: [120, 150, 180, 90, 200],
    //         backgroundColor: "#00ced1", // Teal
    //       },
    //       {
    //         label: "Pendientes",
    //         data: [30, 40, 10, 50, 20],
    //         backgroundColor: "#f07167", // Rojo/Naranja
    //       },
    //     ],
    //   },
    //   options: {
    //     responsive: true,
    //     maintainAspectRatio: false,
    //     scales: {
    //       x: { stacked: true, ticks: { color: "#fff" } },
    //       y: { stacked: true, grid: { color: "#30363d" } },
    //     },
    //     plugins: {
    //       legend: { labels: { color: "#fff" } },
    //     },
    //   },
    // });

    // 5. Gráfica Lineal: Articulos más vendidos
    new Chart(document.getElementById("chartContenedores"), {
      type: "polarArea",
      data: {
        labels: ["Rack A", "Rack B", "Rines", "Filtros", "Baterías"],
        datasets: [
          {
            data: [80, 45, 90, 60, 30], // Representa niveles de stock
            backgroundColor: [
              "rgba(0, 206, 209, 0.5)",
              "rgba(42, 157, 143, 0.5)",
              "rgba(233, 196, 106, 0.5)",
              "rgba(244, 162, 97, 0.5)",
              "rgba(240, 113, 103, 0.5)",
            ],
            borderColor: "#fff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid: { color: "#30363d" },
            ticks: { display: false }, // Limpia el diseño
          },
        },
        plugins: {
          legend: { position: "right", labels: { color: "#fff" } },
        },
      },
    });
}
// Escuchar cambios en el select de bodegas
document.getElementById("select_bodegas").addEventListener('change', function() {
    console.log("Cambiando datos para bodega: " + this.value);
    // Aquí podrías disparar un fetch a tu API enviando el ID de la bodega
    // updateDashWithRealData(this.value);
});

function cargarBodegas() {
    const bodegasSelect = document.getElementById("select_bodegas");
    fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
        .then(res => res.json())
        .then(data => {
            if (data.respuesta) {
                bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';
                data.respuesta.forEach(b => {
                    const opt = new Option(b.NOMBRE, b.BODEGA);
                    bodegasSelect.add(opt);
                });
                M.FormSelect.init(bodegasSelect);
            }
        }).catch(err => console.error("Error al cargar bodegas:", err));
}
function initMapaPanama() {
    const mapContainer = document.getElementById('mapPanama');
    if (!mapContainer) return;

    const map = L.map('mapPanama').setView([8.538, -80.782], 7);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const bodegas = [
        // --- GRUPO BREMEN ---
        { id: "BR-TM", nombre: "Bremen - Tumba Muerto", coords: [9.0251, -79.5226], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=10079881889526052492&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-C50", nombre: "Bremen - Calle 50", coords: [8.9885, -79.5127], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=1277513250532887642&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-24D", nombre: "Bremen - 24 de Diciembre", coords: [9.1013, -79.3854], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=11913408935496564016&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-DAV", nombre: "Bremen - David", coords: [8.4238, -82.4323], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=14462542309345647693&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-CHI", nombre: "Bremen - Chitré", coords: [7.9600, -80.4297], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=13706581016572968707&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-SAN", nombre: "Bremen - Santiago", coords: [8.1046, -80.9701], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=14334376120144714680&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "BR-PEN", nombre: "Bremen - Penonomé", coords: [8.5144, -80.3589], tipo: "Bremen", gmaps: "https://maps.google.com/?cid=10742304592685314903&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },

        // --- GRUPO NORWING ---
        { id: "CEDI-01", nombre: "CEDI Norwing - Pueblo Nuevo", coords: [9.019268, -79.5131725], tipo: "CEDI", gmaps: "https://www.google.com/maps/search/?api=1&query=9.019268,-79.5131725" },
       // { id: "NW-PN", nombre: "Norwing - Pueblo Nuevo", coords: [9.0192, -79.5131], tipo: "Norwing", gmaps: "https://www.google.com/maps/search/?api=1&query=9.019268,-79.5131725" },
        { id: "NW-PC", nombre: "Norwing - Plaza Carolina", coords: [9.0278, -79.4798], tipo: "Norwing", gmaps: "https://maps.google.com/?cid=1291211260969938617&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" },
        { id: "NW-DAV", nombre: "Norwing - David (San Mateo)", coords: [8.4287, -82.4351], tipo: "Norwing", gmaps: "https://maps.google.com/?cid=7297405406566993614&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" }
    ];

    bodegas.forEach(b => {
        const esCEDI = b.tipo === "CEDI";
        
        // Estilo dinámico: CEDI resalta más
        const marker = L.circleMarker(b.coords, {
            radius: esCEDI ? 12 : 9,
            fillColor: esCEDI ? "#ff9800" : "#00ced1", // Naranja para CEDI, Teal para sucursales
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        // Popup con ID de WMS y link a Maps
        marker.bindPopup(`
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; min-width: 200px;">
                    <strong style="font-size: 15px; color: #008b8b;">${b.nombre}</strong><br>
                    <span style="color: #666; font-size: 12px;">ID WMS: <b>${b.id}</b></span><br>
                    <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
                    
                    <div style="display: flex; flex-direction: column; gap: 5px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>📦 <b>Total de Pedidos:</b></span>
                            <span>200</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #2e7d32;">
                            <span>✅ <b>Finalizados:</b></span>
                            <span>50</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #d32f2f;">
                            <span>⏳ <b>Pendientes:</b></span>
                            <span>150</span>
                        </div>
                    </div>

                    <a href="${b.gmaps}" target="_blank" style="display: block; margin-top: 12px; padding: 8px; background: #00ced1; color: white; text-align: center; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">
                        📍 ABRIR EN GOOGLE MAPS
                    </a>
                </div>
            `);       
    });
}
// Asegurar que se ejecute después de que cargue el DOM
$(document).ready(function() {
    initMapaPanama();
});

/**
 * Actualiza todos los componentes del dashboard basándose en la bodega elegida
 * @param {string} idBodega - El ID de la bodega (ej: 'CEDI-01', 'BR-DAV')
 */
function actualizarDashboard(idBodega) {
    console.log("Actualizando dashboard para bodega: " + idBodega);

    // 1. Mostrar un loader si lo tienes (Opcional)
    // if(typeof showLoader === 'function') showLoader();

    // 2. Buscar los datos de la bodega en nuestro array de 'bodegas' 
    // (El que definimos en initMapaPanama)
    const infoBodega = bodegas.find(b => b.id === idBodega);

    if (infoBodega) {
        // --- EFECTO EN EL MAPA ---
        // Volamos a la ubicación de la bodega seleccionada con un zoom de 15 (nivel calle/bodega)
        map.flyTo(infoBodega.coords, 15, {
            animate: true,
            duration: 1.5
        });

        // Opcional: Abrir el popup automáticamente
        // L.popup().setLatLng(infoBodega.coords).setContent(`<b>Cargando datos de ${infoBodega.nombre}...</b>`).openOn(map);
    }

    // 3. Simulación de Fetch a la API
    // En el futuro, aquí harías: fetch(env.API_URL + 'GetData?id=' + idBodega)...
    
    // Datos aleatorios para simular el cambio visual inmediato
    const randomTotal = Math.floor(Math.random() * 500) + 100;
    const randomFinal = Math.floor(randomTotal * 0.7);
    const randomPendiente = randomTotal - randomFinal;

    // --- ACTUALIZAR KPIs ---
    document.getElementById('kpi_pedidos').innerText = randomTotal;
    document.getElementById('kpi_items').innerText = (randomTotal * 12.5).toFixed(0); // Simulación de ítems
    document.getElementById('kpi_pendientes').innerText = randomPendiente;
    
    // --- ACTUALIZAR GRÁFICAS ---
    // Importante: Debes tener las variables de tus charts (chartStatus, chartZonas, etc.) 
    // declaradas de forma global para poder acceder a .data y .update()

    if (window.myChartStatus) {
        window.myChartStatus.data.datasets[0].data = [
            randomPendiente, 
            Math.floor(randomPendiente * 0.5), 
            Math.floor(randomFinal * 0.2), 
            randomFinal
        ];
        window.myChartStatus.update();
    }

    if (window.myChartZonas) {
        // Cambiamos proporciones de ocupación de racks
        window.myChartZonas.data.datasets[0].data = [
            Math.random() * 50, 
            Math.random() * 50, 
            Math.random() * 50, 
            Math.random() * 50
        ];
        window.myChartZonas.update();
    }

    M.toast({html: `Datos de ${infoBodega ? infoBodega.nombre : idBodega} actualizados`, classes: 'rounded'});
}