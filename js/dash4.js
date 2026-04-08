// Variables globales para almacenar la data si la necesitas después
let dataGlobalPedidos = [];
//let datosArray = []; // Para la tabla, si decides implementarla

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM successfully loaded and parsed");

    // 1. Ejecutamos la carga inicial (esta función ya debe obtener la data y renderizar)
    actualizarDashboard();

    // 2. Programamos la actualización automática cada 5 minutos
    const CINCO_MINUTOS = 300000;
    setInterval(actualizarDashboard, CINCO_MINUTOS);
});

// document.addEventListener("DOMContentLoaded", async function () {
//     console.log("DOM successfully loaded and parsed");

//     // Usamos Promise.all para disparar ambas peticiones al mismo tiempo (más rápido)
//     try {
//         const [pendientes, finalizados] = await Promise.all([
//             obtenerPedidos("R"),
//             obtenerPedidos("FF")
//         ]);

//         const totalPendientes = pendientes.length;
//         const totalFinalizados = finalizados.length;
//         const totalDePedidos = totalPendientes + totalFinalizados;

//         console.log("Total de Pedidos Pendientes:", totalPendientes);
//         console.log("Total de Pedidos Finalizados:", totalFinalizados);
//         console.log("Suma Total:", totalDePedidos);
//         // console.log("Datos:", { pendientes, finalizados });

//         // Unimos toda la data para los gráficos y la tabla
//         dataGlobalPedidos = [...pendientes, ...finalizados];
//         console.log("Datos:", dataGlobalPedidos);


//         // Ejecutar actualizaciones de UI
//         actualizarKpisConDatosReales(dataGlobalPedidos);
//         renderizarDashboardWMS(dataGlobalPedidos);
//         //cargarTabla(dataGlobalPedidos);

//     } catch (error) {
//         console.error("Error cargando los datos del Dashboard:", error);
//     }
// });

/**
 * Función única y robusta para consultar pedidos
 * @param {string} pOpcion - "R" para pendientes, "P" para finalizados
 */
async function obtenerPedidos(pOpcion) {
  const pUsuario = document.getElementById("hUsuario").value;
  const bodega = document.getElementById("bodega").value;

  // 1. Obtener la fecha de hoy
  const fechaHoy = new Date();

  // 2. Clonar la fecha y restar 4 días (para que con hoy sumen 5)
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaHoy.getDate() - 4);

  // 3. Formatear ambas a YYYY-MM-DD
  const pFechaHasta = fechaHoy.toISOString().split("T")[0];
  const pFechaDesde = fechaDesde.toISOString().split("T")[0];

  console.log("Desde:", pFechaDesde); // Ejemplo: 2026-03-09
  console.log("Hasta:", pFechaHasta); // Ejemplo: 2026-03-13

  //const params = `?pBodega=${bodega}&pFechaDesde=${pFechaDesde}&pFechaHasta=${pFechaHasta}&pUsuario=${pUsuario}&pPedido=&pOpcion=${pOpcion}`;
  const params = `?pBodega=B-01&pFechaDesde=2025-01-01&pFechaHasta=2025-01-30&pUsuario=PRUEBAPMA&pPedido=&pOpcion=${pOpcion}`;
  try {
    const response = await fetch(
      env.API_URL + "wmsverificacionpedidos/P" + params,
      myInit,
    );

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const result = await response.json();

    if (result.msg === "SUCCESS") {
      return result.pedidos || []; // Retorna el array de pedidos
    } else {
      console.warn(`Aviso API (${pOpcion}):`, result.msg);
      return [];
    }
  } catch (error) {
    console.error(`Error en fetch pedidos (${pOpcion}):`, error);
    return [];
  }
}


/**
 * @function renderizarDashboardWMS
 * @param {Array} data - El array de transacciones/pedidos combinados
 */
function renderizarDashboardWMS(data) {
    if (!data || data.length === 0) {
        console.warn("No hay datos para renderizar las gráficas.");
        return;
    }

    // Por ahora, solo renderizamos la de Precisión como solicitaste
    renderizarGraficoPrecision(data);

    // Aquí irían las demás en el futuro...
    // renderizarGraficoStatus(data);
    // renderizarGraficoArticulos(data);
}

let myChartPrecision = null;

function renderizarGraficoPrecision(data) {
    const canvas = document.getElementById('chartPrecision');
    if (!canvas) return;

    let exacto = 0;
    let discrepancia = 0;

    data.forEach(item => {
        const estado = item.ESTADO_PREPARACION;
        const totalSolicitado = parseFloat(item.TOTAL_UNIDADES) || 0;
        const verificado = parseFloat(item.LINEAS_VERIFICADAS) || 0;
        const preparadas = parseFloat(item.LINEAS_PREPARADAS) || 0;

        // LÓGICA DE PRECISIÓN:
        // Solo evaluamos pedidos Finalizados (P) o Guardados (G) 
        // porque son los que ya pasaron por las manos de un operario.
        if (estado === "P" || estado === "G") {
            // Un pedido es EXACTO si lo verificado coincide con el total solicitado
            if (totalSolicitado > 0 && verificado === totalSolicitado) {
                exacto++;
            } else {
                // Si está en P o G pero las unidades no cuadran, es una DISCREPANCIA
                discrepancia++;
            }
        }
    });

    const totalAnalizado = exacto + discrepancia;
    const porcentaje = totalAnalizado > 0 ? (exacto / totalAnalizado) : 0;

    if (myChartPrecision) { myChartPrecision.destroy(); }

    myChartPrecision = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Exacto', 'Discrepancia'],
            datasets: [{
                data: [exacto, discrepancia],
                backgroundColor: ['#2a9d8f', '#e76f51'], 
                borderWidth: 0,
                cutout: '80%',
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { bottom: 30 } },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    enabled: true,
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw} Pedidos Gestionados`
                    }
                }
            }
        },
        plugins: [{
            id: 'gaugeNeedle',
            afterDatasetsDraw: (chart) => {
                const { ctx, chartArea: { width } } = chart;
                ctx.save();
                const xCenter = width / 2;
                const yCenter = chart._metasets[0].data[0].y; 
                const outerRadius = chart._metasets[0].data[0].outerRadius;

                // Aguja: 0% es izquierda (Math.PI), 100% es derecha (2*Math.PI)
                const angle = Math.PI + (porcentaje * Math.PI);

                ctx.translate(xCenter, yCenter);
                ctx.rotate(angle);
                
                ctx.beginPath();
                ctx.moveTo(0, -3); 
                ctx.lineTo(outerRadius - 10, 0); 
                ctx.lineTo(0, 3); 
                ctx.fillStyle = '#f1390a';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.font = 'bold 1.8em Orbitron';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText((porcentaje * 100).toFixed(1) + '%', xCenter, yCenter + 35);
                ctx.restore();
            }
        }]
    });
}

/**
 * @function actualizarKpisConDatosReales
 * @description Procesa la lista de pedidos para actualizar los contadores visuales.
 */
function actualizarKpisConDatosReales(data) {
    if (!data || data.length === 0) return;

    let totalPedidos = data.length;
    let finalizados = 0;
    let pendientes = 0;
    let unidadesTotales = 0;
    let unidadesVerificadas = 0;

    data.forEach(item => {
        // 1. Contar por Estado de Preparación
        // Según tu data: "P" es Finalizado, cualquier otra cosa es Pendiente
        if (item.ESTADO_PREPARACION === "P") {
            finalizados++;
        } else {
            pendientes++;
        }

        // 2. Sumar unidades para calcular la eficiencia real del picking
        unidadesTotales += parseFloat(item.TOTAL_UNIDADES) || 0;
        unidadesVerificadas += parseFloat(item.LINEAS_VERIFICADAS) || 0;
    });

    // 3. Calcular % de Eficiencia (Basado en cumplimiento de unidades)
    const eficiencia = unidadesTotales > 0 
        ? ((unidadesVerificadas / unidadesTotales) * 100).toFixed(1) 
        : "0.0";

    // Actualizar el DOM con los IDs de tu nuevo HTML
    document.getElementById('kpi_pedidos').innerText = totalPedidos;
    document.getElementById('kpi_finalizados').innerText = finalizados;
    document.getElementById('kpi_compras').innerText = pendientes; // En tu HTML el ID es kpi_compras pero el título es "Pendientes"
    document.getElementById('kpi_eficiencia').innerText = eficiencia + "%";
}


// Función que orquesta toda la actualización
async function actualizarDashboard() {
    console.log("Actualizando datos del sistema... " + new Date().toLocaleTimeString());
    
    try {
        // 1. Obtener la data (usando la función que ya mejoramos)
        const dataPendientes = await obtenerPedidos("R");
        const dataFinalizados = await obtenerPedidos("FF");
        
        const todaLaData = [...dataPendientes, ...dataFinalizados];

        // 2. Actualizar los componentes visuales
        actualizarKpisConDatosReales(todaLaData);
        renderizarGraficoPrecision(todaLaData);
        
        // Si tienes una tabla, también la actualizas aquí
        // actualizarTabla(todaLaData); 

    } catch (error) {
        console.error("Error en la actualización automática:", error);
    }
}
//let params = `?pBodega=B-06&pFechaDesde=2025-01-01&pFechaHasta=2025-01-30&pUsuario=PRUEBAPMA&pPedido=&pOpcion=${pOpcion}`;