// VARIABLES GLOBALES PARA ALMACENAR DATOS Y GRAFICOS
let allAdjustmentsData = [];
let chartTendenciaUnidades = null;
let chartTendenciaCostos = null;
let chartTopBodegas = null;
let chartClasificaciones = null;
let chartDistribucionGauge = null;

// MESES EN ESPAÑOL
const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// OBTENER FECHAS PREDETERMINADAS (Desde inicio de año hasta último día del mes anterior)
function obtenerFechasPredeterminadas() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    let startYear = currentYear;
    if (currentMonth === 0) {
        startYear = currentYear - 1;
    }

    const fechaDesde = `${startYear}-01-01`;

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0);
    const y = prevMonthLastDay.getFullYear();
    const m = String(prevMonthLastDay.getMonth() + 1).padStart(2, '0');
    const d = String(prevMonthLastDay.getDate()).padStart(2, '0');
    const fechaHasta = `${y}-${m}-${d}`;

    return { fechaDesde, fechaHasta };
}

// INICIALIZACIÓN AL CARGAR EL DOM
document.addEventListener("DOMContentLoaded", async function () {
    console.log("Inicializando Dashboard de Ajustes Físicos...");

    // 1. Establecer valores de fecha predeterminados dinámicamente
    const defaults = obtenerFechasPredeterminadas();
    document.getElementById("filter_fecha_desde").value = defaults.fechaDesde;
    document.getElementById("filter_fecha_hasta").value = defaults.fechaHasta;

    // 2. Poblar los filtros dropdown de forma asíncrona desde los SPs correspondientes
    await poblarFiltros();

    // 3. Renderizar el dashboard inicialmente con todos los datos
    actualizarDashboard();

    // Opcional: inicializar tooltips o dropdowns de Materialize si son necesarios
    M.AutoInit();
});

// HABILITAR / DESHABILITAR SELECT DE BODEGA SEGÚN CHECKBOX "TODAS"
function toggleBodegaSelect() {
    const chkTodas = document.getElementById("chk_todas_bodegas");
    const selectBodega = document.getElementById("filter_bodega");

    if (chkTodas.checked) {
        selectBodega.disabled = true;
        selectBodega.value = "";
    } else {
        selectBodega.disabled = false;
    }

    // RE-INICIALIZAR SELECT EN MATERIALIZE PARA APLICAR CAMBIO DE ESTADO VISUAL
    M.FormSelect.init(selectBodega);
}

// OBTENER LISTADO DE BODEGAS DESDE EL CONTROL SELECT DE LA UI (Pobladas dinámicamente)
function obtenerBodegasDesdeUI() {
    const select = document.getElementById("filter_bodega");
    const list = [];
    for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value && !opt.disabled) {
            const parts = opt.text.split(" - ");
            const nom = parts.length > 1 ? parts.slice(1).join(" - ") : opt.text;
            list.push({ cod: opt.value, nom: nom });
        }
    }
    return list;
}

// OBTENER LISTADO DE CLASIFICACIONES DESDE EL CONTROL SELECT DE LA UI
function obtenerClasificacionesDesdeUI() {
    const select = document.getElementById("filter_clase1");
    const list = [];
    for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value) {
            list.push(opt.text);
        }
    }
    return list;
}

// GENERADOR DE DATOS DE PRUEBA (MOCK DATA DOCKING DESDE BASE DE DATOS)
function generarDatosDashboard() {
    const list = [];

    // Cargar bodegas y clasificaciones directamente desde el DOM (pobladas por los SP)
    const bodegas = obtenerBodegasDesdeUI();
    const clases1 = obtenerClasificacionesDesdeUI();

    if (bodegas.length === 0) {
        console.warn("No hay bodegas disponibles en el DOM para generar datos de prueba.");
        return [];
    }

    const fDesdeVal = document.getElementById("filter_fecha_desde").value;
    const yearToGenerate = fDesdeVal ? new Date(fDesdeVal).getFullYear() : new Date().getFullYear();

    const clases1Final = clases1.length > 0 ? clases1 : [
        "1060 - Lubricantes",
        "1040 - Repuestos",
        "1050 - Accesorios",
        "1070 - Llantas"
    ];

    const clases2 = ["Clase A-1", "Clase A-2", "Clase A-3"];
    const clases3 = ["Línea Premium", "Línea Estándar", "Línea Económica"];

    const articulos = [
        { cod: "ART-00123", desc: "Filtro de Aceite Premium", clase: clases1Final[0] || "Lubricantes", unitCost: 12.50 },
        { cod: "ART-00456", desc: "Aceite Multigrado 15W40", clase: clases1Final[0] || "Lubricantes", unitCost: 35.80 },
        { cod: "ART-00789", desc: "Bujía Universal NGK", clase: clases1Final[1] || "Repuestos", unitCost: 4.50 },
        { cod: "ART-00234", desc: "Pastilla de Freno Delantera", clase: clases1Final[1] || "Repuestos", unitCost: 48.00 },
        { cod: "ART-00678", desc: "Filtro de Aire Bremen", clase: clases1Final[0] || "Lubricantes", unitCost: 18.20 },
        { cod: "ART-00912", desc: "Amortiguador de Gas Trasero", clase: clases1Final[1] || "Repuestos", unitCost: 125.00 }
    ];

    // Generamos data transaccional para cada mes del año
    for (let month = 1; month <= 12; month++) {
        articulos.forEach((art, index) => {
            bodegas.forEach((bod, bIdx) => {
                const auditoriaFactor = (month === 6 || month === 12) ? 2.5 : 1.0;

                // Sobrantes (Positivos): Naturaleza Entrada
                let posUnits = 0;
                if ((month + index + bIdx) % 3 === 0) {
                    posUnits = Math.round(((Math.sin(month + index) + 1) * 12 + 2) * auditoriaFactor);
                }

                // Faltantes (Negativos): Naturaleza Salida
                let negUnits = 0;
                if ((month * index + bIdx) % 2 === 0) {
                    negUnits = Math.round(((Math.cos(month - bIdx) + 1) * 16 + 3) * auditoriaFactor);
                }

                if (posUnits > 0 || negUnits > 0) {
                    const posCost = parseFloat((posUnits * art.unitCost).toFixed(2));
                    const negCost = parseFloat((negUnits * art.unitCost).toFixed(2));

                    list.push({
                        bodega: bod.cod,
                        bodega_descripcion: bod.nom,
                        articulo: art.cod,
                        articulo_descripcion: art.desc,
                        anio: yearToGenerate,
                        mes: month,
                        clasificacion_1: art.clase,
                        clasificacion_2: clases2[(index + bIdx) % clases2.length],
                        clasificacion_3: clases3[(month + index) % clases3.length],
                        fisico_pos_unds: posUnits,
                        fisico_neg_unds: negUnits,
                        fisico_neto_unds: posUnits - negUnits,
                        fisico_pos_cost: posCost,
                        fisico_neg_cost: negCost,
                        fisico_neto_cost: parseFloat((posCost - negCost).toFixed(2))
                    });
                }
            });
        });
    }

    return list;
}

// CARGAR FILTROS DESDE LOS PROCEDIMIENTOS ALMACENADOS (DINÁMICO DESDE BASE DE DATOS)
async function poblarFiltros() {
    const selectBodega = document.getElementById("filter_bodega");
    const c1 = document.getElementById("filter_clase1");
    const c2 = document.getElementById("filter_clase2");
    const c3 = document.getElementById("filter_clase3");

    // 1. CARGAR BODEGAS (Ejecuta EXEC [CLSA].[WMS_sp_ObtenerBodegas] a través del endpoint activo)
    try {
        const response = await fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra", myInit);
        const result = await response.json();

        selectBodega.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';
        const arr = result.respuesta || result.bodegas || [];
        if (result.msg === "SUCCESS" && arr.length > 0) {
            arr.forEach(b => {
                // Filtrar excluyendo B-03, TRANS, B-80, B-54 según requerimiento
                if (!['B-03', 'TRANS', 'B-80', 'B-54'].includes(b.BODEGA)) {
                    selectBodega.add(new Option(`${b.BODEGA} - ${b.NOMBRE}`, b.BODEGA));
                }
            });
            // Re-inicializar select de bodega en Materialize
            M.FormSelect.init(selectBodega);
        } else {
            console.error("No se pudieron cargar las bodegas reales de la base de datos.");
        }
    } catch (e) {
        console.error("Error al conectar al endpoint de bodegas:", e);
    }

    // 2. CARGAR CLASIFICACIONES DE NIVEL 1 (Ejecuta [CLSA].[WMS_sp_getFiltroClasificaciones])
    try {
        const response = await fetch(env.API_URL + "filtroswms", myInit);
        const result = await response.json();

        c1.innerHTML = '<option value="" selected>Todas</option>';
        c2.innerHTML = '<option value="" selected>Todas</option>';
        c3.innerHTML = '<option value="" selected>Todas</option>';

        const arr = result.filtros || result.respuesta || [];
        if (result.msg === "SUCCESS" && arr.length > 0) {
            arr.forEach(item => {
                c1.add(new Option(item.DESCRIPCION, item.CLASIFICACION_1));
            });
            // Re-inicializar selects en Materialize
            M.FormSelect.init([c1, c2, c3]);
        }
    } catch (e) {
        console.error("Error al conectar al endpoint de clasificaciones:", e);
    }

    // Registrar manejadores de eventos para carga en cascada
    c1.addEventListener("change", async function () {
        await cargarClasificacionesNivel2();
    });

    c2.addEventListener("change", async function () {
        await cargarClasificacionesNivel3();
    });
}

// Cargar Marcas en cascada
async function cargarClasificacionesNivel2() {
    const claseVal = document.getElementById("filter_clase1").value;
    const c2 = document.getElementById("filter_clase2");
    const c3 = document.getElementById("filter_clase3");

    c2.innerHTML = '<option value="" selected>Todas</option>';
    c3.innerHTML = '<option value="" selected>Todas</option>';

    if (!claseVal) {
        M.FormSelect.init([c2, c3]);
        return;
    }

    try {
        const response = await fetch(env.API_URL + "filtroswms?clase=" + claseVal, myInit);
        const result = await response.json();
        const arr = result.filtros || result.respuesta || [];
        if (result.msg === "SUCCESS" && arr.length > 0) {
            arr.forEach(item => {
                c2.add(new Option(item.DESCRIPCION, item.CLASIFICACION_2));
            });
        }
    } catch (e) {
        console.error("Error al obtener clasificaciones nivel 2:", e);
    }

    M.FormSelect.init([c2, c3]);
}

// Cargar Tipos en cascada
async function cargarClasificacionesNivel3() {
    const claseVal = document.getElementById("filter_clase1").value;
    const marcaVal = document.getElementById("filter_clase2").value;
    const c3 = document.getElementById("filter_clase3");

    c3.innerHTML = '<option value="" selected>Todas</option>';

    if (!claseVal || !marcaVal) {
        M.FormSelect.init(c3);
        return;
    }

    try {
        const response = await fetch(env.API_URL + `filtroswms?clase=${claseVal}&marca=${marcaVal}`, myInit);
        const result = await response.json();
        const arr = result.filtros || result.respuesta || [];
        if (result.msg === "SUCCESS" && arr.length > 0) {
            arr.forEach(item => {
                c3.add(new Option(item.DESCRIPCION, item.CLASIFICACION_3));
            });
        }
    } catch (e) {
        console.error("Error al obtener clasificaciones nivel 3:", e);
    }

    M.FormSelect.init(c3);
}

// LIMPIAR TODOS LOS FILTROS
function limpiarFiltros() {
    const defaults = obtenerFechasPredeterminadas();
    document.getElementById("filter_fecha_desde").value = defaults.fechaDesde;
    document.getElementById("filter_fecha_hasta").value = defaults.fechaHasta;

    const chkTodas = document.getElementById("chk_todas_bodegas");
    chkTodas.checked = true;
    toggleBodegaSelect();

    document.getElementById("filter_clase1").value = "";
    document.getElementById("filter_clase2").innerHTML = '<option value="" selected>Todas</option>';
    document.getElementById("filter_clase3").innerHTML = '<option value="" selected>Todas</option>';

    M.FormSelect.init([
        document.getElementById("filter_clase1"),
        document.getElementById("filter_clase2"),
        document.getElementById("filter_clase3")
    ]);

    actualizarDashboard();
    M.toast({ html: "Filtros limpiados", classes: "rounded blue" });
}

// APLICAR LOS FILTROS Y ACTUALIZAR
function aplicarFiltros() {
    const chkTodas = document.getElementById("chk_todas_bodegas").checked;
    const selectBodega = document.getElementById("filter_bodega").value;

    if (!chkTodas && !selectBodega) {
        Swal.fire({
            icon: 'warning',
            title: 'Falta bodega',
            text: 'Por favor seleccione una bodega específica o active la opción "Todas las bodegas".',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    actualizarDashboard();
    M.toast({ html: "Filtros aplicados correctamente", classes: "rounded green" });
}

// OBTENER DATA DE PRUEBA FILTRADA LOCALMENTE (FALLBACK DE SEGURIDAD)
function generarDatosDashboardFiltradosLocales() {
    const list = generarDatosDashboard();
    const fDesdeVal = document.getElementById("filter_fecha_desde").value;
    const fHastaVal = document.getElementById("filter_fecha_hasta").value;
    const chkTodasBodegas = document.getElementById("chk_todas_bodegas").checked;
    const bodegaVal = document.getElementById("filter_bodega").value;
    const c1Val = document.getElementById("filter_clase1").value;
    const c2Val = document.getElementById("filter_clase2").value;
    const c3Val = document.getElementById("filter_clase3").value;

    return list.filter(item => {
        if (fDesdeVal && fHastaVal) {
            const dateFrom = new Date(fDesdeVal);
            const dateTo = new Date(fHastaVal);
            const itemDate = new Date(item.anio, item.mes - 1, 15);
            if (itemDate < dateFrom || itemDate > dateTo) return false;
        }

        if (!chkTodasBodegas && bodegaVal) {
            if (item.bodega !== bodegaVal) return false;
        }

        if (c1Val && item.clasificacion_1 !== c1Val) return false;
        if (c2Val && item.clasificacion_2 !== c2Val) return false;
        if (c3Val && item.clasificacion_3 !== c3Val) return false;

        return true;
    });
}

// CONSULTAR EL PROCEDIMIENTO ALMACENADO MEDIANTE LA API (ASÍNCRONO)
async function fetchDashboardData() {
    const fDesdeVal = document.getElementById("filter_fecha_desde").value;
    const fHastaVal = document.getElementById("filter_fecha_hasta").value;
    const chkTodasBodegas = document.getElementById("chk_todas_bodegas").checked;
    const bodegaVal = document.getElementById("filter_bodega").value;
    const c1Val = document.getElementById("filter_clase1").value;
    const c2Val = document.getElementById("filter_clase2").value;
    const c3Val = document.getElementById("filter_clase3").value;

    const defaults = obtenerFechasPredeterminadas();

    // Actualizar etiquetas visuales de períodos
    if (fDesdeVal && fHastaVal) {
        const [y1, m1, d1] = fDesdeVal.split("-");
        const [y2, m2, d2] = fHastaVal.split("-");
        document.getElementById("lbl_periodo_seleccionado").innerText = `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
    }

    // Construir parámetros para el SP CLSA.SP_WMSDashAjustesFisicos (sin pClasificacionHasta ya que se cambió a igualdad)
    const queryParams = {
        pFechaDesde: fDesdeVal || defaults.fechaDesde,
        pFechaHasta: fHastaVal || defaults.fechaHasta,
        pTipoCosto: "F",
        pMonedaCalculo: "L"
    };

    if (!chkTodasBodegas && bodegaVal) {
        queryParams.pBodega = bodegaVal;
    }
    if (c1Val) {
        queryParams.pClasificacion1Desde = c1Val;
    }
    if (c2Val) {
        queryParams.pClasificacion2Desde = c2Val;
    }
    if (c3Val) {
        queryParams.pClasificacion3Desde = c3Val;
    }

    const params = new URLSearchParams(queryParams).toString();

    // Construir parámetros para el SP CLSA.SP_WMS_CostoInvActual
    const invQueryParams = {};
    if (!chkTodasBodegas && bodegaVal) {
        invQueryParams.pBodega = bodegaVal;
    }
    if (c1Val) {
        invQueryParams.pClasificacion1Desde = c1Val;
    }
    if (c2Val) {
        invQueryParams.pClasificacion2Desde = c2Val;
    }
    if (c3Val) {
        invQueryParams.pClasificacion3Desde = c3Val;
    }
    const invParams = new URLSearchParams(invQueryParams).toString();

    mostrarLoader();

    let valorInventarioTeorico = 10000000; // Fallback por defecto
    let ajusteNetoCostoAnterior = 0; // Fallback por defecto del período anterior

    try {
        // Consultas en paralelo para optimizar rendimiento
        const [response, invResponse] = await Promise.all([
            fetch(`${env.API_URL}wmsdashajustesfisicos?${params}`, myInit),
            fetch(`${env.API_URL}wmscostoinvactual?${invParams}`, myInit).catch(err => {
                console.error("Error al obtener costo del inventario actual:", err);
                return null;
            })
        ]);

        // Procesar costo del inventario actual
        if (invResponse) {
            try {
                const invResult = await invResponse.json();
                if (invResult.msg === "SUCCESS" && invResult.resultado) {
                    const dataInv = invResult.resultado;
                    const totalInv = Array.isArray(dataInv) && dataInv.length > 0
                        ? parseFloat(dataInv[0].COSTO_PROM_TOTAL_INV || dataInv[0].costo_prom_total_inv || 0)
                        : parseFloat(dataInv.COSTO_PROM_TOTAL_INV || dataInv.costo_prom_total_inv || 0);
                    if (totalInv > 0) {
                        valorInventarioTeorico = totalInv;
                    }
                }
            } catch (eInv) {
                console.error("Error al parsear JSON del costo del inventario:", eInv);
            }
        }

        const result = await response.json();

        if (result.msg === "SUCCESS" && result.resultado && result.resultado.length > 0) {
            // Extraer el costo de ajustes del período anterior de la primera fila si viene de la base de datos
            ajusteNetoCostoAnterior = parseFloat(
                result.resultado[0].ajuste_neto_costo_anterior ||
                result.resultado[0].AJUSTE_NETO_COSTO_ANTERIOR ||
                0
            );

            allAdjustmentsData = result.resultado.map(item => ({
                bodega: item.BODEGA || item.bodega,
                bodega_descripcion: item.BODEGA_DESCRIPCION || item.bodega_descripcion || item.NOMBRE_BODEGA || "Bodega",
                articulo: item.ARTICULO || item.articulo,
                articulo_descripcion: item.ARTICULO_DESCRIPCION || item.DESCRIPCION || item.articulo_descripcion || "Articulo",
                anio: parseInt(item.ANIO || item.anio || new Date().getFullYear()),
                mes: parseInt(item.MES || item.mes || 1),
                clasificacion_1: item.CLASIFICACION_1 || item.clasificacion_1 || "Lubricantes",
                clasificacion_2: item.CLASIFICACION_2 || item.clasificacion_2 || "Clase",
                clasificacion_3: item.CLASIFICACION_3 || item.clasificacion_3 || "Linea",
                fisico_pos_unds: parseFloat(item.FISICO_POS_UNDS || item.fisico_pos_unds || 0),
                fisico_neg_unds: parseFloat(item.FISICO_NEG_UNDS || item.fisico_neg_unds || 0),
                fisico_neto_unds: parseFloat(item.FISICO_NETO_UNDS || item.fisico_neto_unds || 0),
                fisico_pos_cost: parseFloat(item.FISICO_POS_COST || item.fisico_pos_cost || 0),
                fisico_neg_cost: parseFloat(item.FISICO_NEG_COST || item.fisico_neg_cost || 0),
                fisico_neto_cost: parseFloat(item.FISICO_NETO_COST || item.fisico_neto_cost || 0)
            }));
            console.log("Datos del dashboard cargados desde SP de base de datos:", allAdjustmentsData.length);
        } else {
            console.warn("La API retornó vacío o error, usando mock data local...");
            allAdjustmentsData = generarDatosDashboardFiltradosLocales();
        }
    } catch (e) {
        console.error("Error al obtener datos del SP de ajustes físicos:", e);
        allAdjustmentsData = generarDatosDashboardFiltradosLocales();
    } finally {
        ocultarLoader();
        // Actualizar la fecha y hora de última actualización con la hora local actual
        const now = new Date();
        const formattedNow = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'p.m.' : 'a.m.'}`;
        const lblAct = document.getElementById("txt_ultima_actualizacion");
        if (lblAct) lblAct.innerText = formattedNow;
    }

    renderizarDashboard(allAdjustmentsData, valorInventarioTeorico, ajusteNetoCostoAnterior);
}

// PROCESAR Y RENDERIZAR TODOS LOS COMPONENTES CON LA DATA FILTRADA
function actualizarDashboard() {
    fetchDashboardData();
}

function renderizarDashboard(data, valorInventarioTeorico, ajusteNetoCostoAnterior) {
    // Si no hay datos, inicializamos con valores vacíos
    actualizarKPIs(data, valorInventarioTeorico, ajusteNetoCostoAnterior);
    renderizarTendencias(data);
    renderizarTopBodegas(data);
    renderizarClasificaciones(data);
    renderizarHeatmap(data);
    renderizarTablasDetalle(data);
    renderizarDistribucionGauge(data);
}

// 1. ACTUALIZAR LOS KPIs PRINCIPALES (TARJETAS SUPERIORES)
function actualizarKPIs(data, valorInventarioTeorico = 10000000, ajusteNetoCostoAnterior = 0) {
    let posUnits = 0;
    let posCost = 0;
    let negUnits = 0;
    let negCost = 0;
    const articulosUnicos = {};
    const bodegasUnicas = {};

    data.forEach(item => {
        posUnits += item.fisico_pos_unds;
        posCost += item.fisico_pos_cost;
        negUnits += item.fisico_neg_unds;
        negCost += item.fisico_neg_cost;

        if (item.fisico_pos_unds > 0 || item.fisico_neg_unds > 0) {
            articulosUnicos[item.articulo] = true;
            bodegasUnicas[item.bodega] = true;
        }
    });

    const netUnits = posUnits - negUnits;
    const netCost = posCost - negCost;
    const totalArticulos = Object.keys(articulosUnicos).length;
    const totalBodegas = Object.keys(bodegasUnicas).length;

    // Calcular Impacto de Ajustes sobre Inventario (Suma de valores absolutos: Enfoque B)
    // Fórmula: ( (Costo Positivo + Costo Negativo) / Valor del Inventario ) * 100
    const teorico = parseFloat(valorInventarioTeorico) || 10000000;
    const costoAjustadoAbsoluto = posCost + negCost;
    const impactoPorcentaje = (costoAjustadoAbsoluto / teorico) * 100;

    // Calcular Impacto para el Período Anterior (Suma de absolutos con base de inventario fija actual)
    const costoAjustadoAbsolutoAnterior = Math.abs(ajusteNetoCostoAnterior);
    const impactoPorcentajeAnterior = (costoAjustadoAbsolutoAnterior / teorico) * 100;

    // Variación dinámica de impacto vs período anterior
    const variacionImpacto = impactoPorcentaje - impactoPorcentajeAnterior;

    // Imprimir en DOM
    document.getElementById("kpi_pos_unidades").innerText = formatNumber(posUnits);
    document.getElementById("kpi_pos_costo").innerText = formatCurrency(posCost);

    document.getElementById("kpi_neg_unidades").innerText = formatNumber(negUnits);
    document.getElementById("kpi_neg_costo").innerText = formatCurrency(negCost);

    document.getElementById("kpi_net_unidades").innerText = (netUnits >= 0 ? "+" : "") + formatNumber(netUnits);
    const lblNet = document.getElementById("kpi_net_costo");
    lblNet.innerText = formatCurrency(netCost);
    if (netCost >= 0) {
        lblNet.className = "kpi-cost-custom text-green";
    } else {
        lblNet.className = "kpi-cost-custom text-red";
    }

    document.getElementById("kpi_articulos_afectados").innerText = formatNumber(totalArticulos);
    document.getElementById("kpi_bodegas_afectadas").innerText = formatNumber(totalBodegas);

    // Pintar el porcentaje de impacto (al ser suma de absolutos, es siempre positivo)
    document.getElementById("kpi_impacto_porcentaje").innerText = impactoPorcentaje.toFixed(2) + "%";
    document.getElementById("kpi_impacto_anterior_porcentaje").innerText = impactoPorcentajeAnterior.toFixed(2) + "%";

    const lblVar = document.getElementById("kpi_impacto_variacion");
    // Lógica de color de variación: una reducción de impacto (<= 0) es operativamente positiva (verde)
    if (variacionImpacto <= 0) {
        lblVar.className = "kpi-variation-custom positive";
        lblVar.innerHTML = `<i class="material-icons tiny left">arrow_downward</i>${Math.abs(variacionImpacto).toFixed(2)}%`;
    } else {
        lblVar.className = "kpi-variation-custom negative";
        lblVar.innerHTML = `<i class="material-icons tiny left">arrow_upward</i>+${variacionImpacto.toFixed(2)}%`;
    }

    // Actualizar onclick del botón info con los valores actuales calculados para el modal dinámico
    const infoIcon = document.querySelector(".kpi-title-custom.text-purple i");
    if (infoIcon) {
        infoIcon.setAttribute("onclick", `mostrarModalFormula(${costoAjustadoAbsoluto}, ${teorico}, ${costoAjustadoAbsolutoAnterior}, ${impactoPorcentaje}, ${impactoPorcentajeAnterior}, ${variacionImpacto})`);
    }
}

// 2. RENDERIZAR TENDENCIAS TEMPORALES Y TABLA MENSUAL
function renderizarTendencias(data) {
    // Inicializar agrupaciones por mes (1-12)
    const mensual = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        nombre: MESES[i],
        posUnds: 0,
        negUnds: 0,
        netUnds: 0,
        posCost: 0,
        negCost: 0,
        netCost: 0
    }));

    data.forEach(item => {
        const mIdx = item.mes - 1;
        if (mIdx >= 0 && mIdx < 12) {
            mensual[mIdx].posUnds += item.fisico_pos_unds;
            mensual[mIdx].negUnds += item.fisico_neg_unds;
            mensual[mIdx].netUnds += item.fisico_neto_unds;
            mensual[mIdx].posCost += item.fisico_pos_cost;
            mensual[mIdx].negCost += item.fisico_neg_cost;
            mensual[mIdx].netCost += item.fisico_neto_cost;
        }
    });

    // Rellenar tabla comparativa mensual
    const tbody = document.getElementById("tbl_comparativo_mensual");
    tbody.innerHTML = "";

    mensual.forEach(m => {
        // Solo mostrar meses que tengan movimientos para no saturar con ceros si hay filtros específicos
        if (m.posUnds > 0 || m.negUnds > 0) {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><b>${m.nombre.substring(0, 3)}</b></td>
                <td>${formatCurrency(m.posCost)}</td>
                <td class="text-red">${formatCurrency(m.negCost)}</td>
                <td class="${m.netCost >= 0 ? 'text-green' : 'text-red'}"><b>${formatCurrency(m.netCost)}</b></td>
            `;
            tbody.appendChild(tr);
        }
    });

    if (tbody.innerHTML === "") {
        tbody.innerHTML = `<tr><td colspan="4" class="center-align text-muted">Sin movimientos registrados</td></tr>`;
    }

    // GRAFICO 1: TENDENCIA DE AJUSTES EN UNIDADES
    const ctxUnds = document.getElementById("chartTendenciaUnidades").getContext("2d");
    if (chartTendenciaUnidades) chartTendenciaUnidades.destroy();

    chartTendenciaUnidades = new Chart(ctxUnds, {
        type: 'line',
        data: {
            labels: MESES.map(m => m.substring(0, 3)),
            datasets: [
                {
                    label: 'Ajustes Positivos',
                    data: mensual.map(m => m.posUnds),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Ajustes Negativos',
                    data: mensual.map(m => m.negUnds),
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.35
                },
                {
                    label: 'Diferencia Neta',
                    data: mensual.map(m => m.netUnds),
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.35
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 } } }
            },
            scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });

    // GRAFICO 2: TENDENCIA DE COSTOS ($)
    const ctxCosts = document.getElementById("chartTendenciaCostos").getContext("2d");
    if (chartTendenciaCostos) chartTendenciaCostos.destroy();

    chartTendenciaCostos = new Chart(ctxCosts, {
        type: 'line',
        data: {
            labels: MESES.map(m => m.substring(0, 3)),
            datasets: [
                {
                    label: 'Costo Positivo',
                    data: mensual.map(m => m.posCost),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Costo Negativo',
                    data: mensual.map(m => m.negCost),
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.35
                },
                {
                    label: 'Diferencia Neta',
                    data: mensual.map(m => m.netCost),
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.35
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 } } }
            },
            scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });
}

// 3. RENDERIZAR TOP BODEGAS Y METRICAS DE CONTROL
function renderizarTopBodegas(data) {
    const bodegasCost = {};
    const bodegasTotalMap = {};
    const bodegasNegativasMap = {};

    data.forEach(item => {
        bodegasTotalMap[item.bodega] = true;

        if (item.fisico_neg_cost > 0) {
            bodegasNegativasMap[item.bodega] = true;
            bodegasCost[item.bodega_descripcion] = (bodegasCost[item.bodega_descripcion] || 0) + item.fisico_neg_cost;
        }
    });

    const sortedBodegas = Object.keys(bodegasCost)
        .map(name => ({ name, val: bodegasCost[name] }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 5);

    const totalB = Object.keys(bodegasTotalMap).length;
    const negB = Object.keys(bodegasNegativasMap).length;
    const pctDiff = totalB > 0 ? ((negB / totalB) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("metric_total_bodegas").innerText = totalB;
    document.getElementById("metric_bodegas_negativas").innerText = negB;
    document.getElementById("metric_porcentaje_diferencia").innerText = pctDiff;

    const ctxB = document.getElementById("chartTopBodegas").getContext("2d");
    if (chartTopBodegas) chartTopBodegas.destroy();

    chartTopBodegas = new Chart(ctxB, {
        type: 'bar',
        data: {
            labels: sortedBodegas.map(b => b.name),
            datasets: [{
                label: 'Costo Faltante ($)',
                data: sortedBodegas.map(b => b.val),
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                hoverBackgroundColor: 'rgba(239, 68, 68, 1)',
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
                y: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });
}

// 4. RENDERIZAR AJUSTES POR CLASIFICACION Y METRICAS
function renderizarClasificaciones(data) {
    const clasesCost = {};
    const clasesTotalMap = {};
    const clasesAjustadasMap = {};

    data.forEach(item => {
        clasesTotalMap[item.clasificacion_1] = true;
        if (item.fisico_neg_cost > 0 || item.fisico_pos_cost > 0) {
            clasesAjustadasMap[item.clasificacion_1] = true;
        }
        if (item.fisico_neg_cost > 0) {
            clasesCost[item.clasificacion_1] = (clasesCost[item.clasificacion_1] || 0) + item.fisico_neg_cost;
        }
    });

    const sortedClases = Object.keys(clasesCost)
        .map(name => ({ name, val: clasesCost[name] }))
        .sort((a, b) => b.val - a.val);

    const totalC = Object.keys(clasesTotalMap).length;
    const ajustC = Object.keys(clasesAjustadasMap).length;

    // Calcular % participación del Top 3
    const totalNegCost = sortedClases.reduce((acc, curr) => acc + curr.val, 0);
    const top3Cost = sortedClases.slice(0, 3).reduce((acc, curr) => acc + curr.val, 0);
    const pctTop3 = totalNegCost > 0 ? ((top3Cost / totalNegCost) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("metric_total_clases").innerText = totalC;
    document.getElementById("metric_clases_ajustadas").innerText = ajustC;
    document.getElementById("metric_porcentaje_top3").innerText = pctTop3;

    // Mostrar Top 5 y agrupar el resto en "Otros"
    const pieData = [];
    const pieLabels = [];
    let otrosSum = 0;

    sortedClases.forEach((c, idx) => {
        if (idx < 4) {
            pieLabels.push(c.name.split(" - ")[1] || c.name);
            pieData.push(c.val);
        } else {
            otrosSum += c.val;
        }
    });

    if (otrosSum > 0) {
        pieLabels.push("Otros");
        pieData.push(otrosSum);
    }

    const ctxC = document.getElementById("chartClasificaciones").getContext("2d");
    if (chartClasificaciones) chartClasificaciones.destroy();

    chartClasificaciones = new Chart(ctxC, {
        type: 'doughnut',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: [
                    '#3b82f6', // Lubricantes
                    '#10b981', // Repuestos
                    '#f59e0b', // Accesorios
                    '#8b5cf6', // Llantas
                    '#ec4899', // Herramientas/Otros
                    '#64748b'  // Gris para el resto
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                        font: { size: 9 }
                    }
                }
            }
        }
    });
}

// 5. RENDERIZAR HEATMAP DINÁMICO (BODEGA VS CLASIFICACIÓN)
function renderizarHeatmap(data) {
    const headerRow = document.getElementById("heatmap_header");
    const tbody = document.getElementById("tbl_heatmap");

    // Limpiar
    headerRow.innerHTML = "<th>Clasificación</th>";
    tbody.innerHTML = "";

    // Obtener las top 5 bodegas con ajustes negativos para las columnas
    const bodegaLossMap = {};
    data.forEach(item => {
        if (item.fisico_neg_cost > 0) {
            bodegaLossMap[item.bodega_descripcion] = (bodegaLossMap[item.bodega_descripcion] || 0) + item.fisico_neg_cost;
        }
    });

    const topBodegasCols = Object.keys(bodegaLossMap)
        .map(name => ({ name, val: bodegaLossMap[name] }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 5)
        .map(b => b.name);

    // Si no hay bodegas, no pintamos nada
    if (topBodegasCols.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="center-align text-muted">Sin datos de pérdidas</td></tr>`;
        return;
    }

    // Agregar headers de columnas
    topBodegasCols.forEach(bName => {
        const th = document.createElement("th");
        th.innerText = bName;
        headerRow.appendChild(th);
    });

    // Agrupar pérdidas por Clasificación y Bodega
    const matrix = {};
    const clasesSet = {};
    let maxVal = 0;

    data.forEach(item => {
        if (item.fisico_neg_cost > 0) {
            clasesSet[item.clasificacion_1] = true;
            if (!matrix[item.clasificacion_1]) matrix[item.clasificacion_1] = {};
            matrix[item.clasificacion_1][item.bodega_descripcion] = (matrix[item.clasificacion_1][item.bodega_descripcion] || 0) + item.fisico_neg_cost;

            if (matrix[item.clasificacion_1][item.bodega_descripcion] > maxVal) {
                maxVal = matrix[item.clasificacion_1][item.bodega_descripcion];
            }
        }
    });

    // Rellenar filas de la tabla heatmap
    Object.keys(clasesSet).sort().forEach(clase => {
        const tr = document.createElement("tr");

        // Columna 1: Clasificación simplificada
        const shortClase = clase.split(" - ")[1] || clase;
        let tdHtml = `<td><b>${shortClase}</b></td>`;

        topBodegasCols.forEach(bName => {
            const val = matrix[clase]?.[bName] || 0;
            // Calcular color de opacidad en base al valor máximo de la matriz
            const ratio = maxVal > 0 ? val / maxVal : 0;
            // Degradado rojo suave
            const bgColor = val > 0 ? `rgba(239, 68, 68, ${0.1 + ratio * 0.8})` : 'transparent';
            const textColor = ratio > 0.5 ? '#ffffff' : 'var(--text-dark)';

            tdHtml += `<td class="heatmap-cell" style="background-color: ${bgColor}; color: ${textColor};">
                ${val > 0 ? formatCurrency(val) : '$0'}
            </td>`;
        });

        tr.innerHTML = tdHtml;
        tbody.appendChild(tr);
    });
}

// 6. RENDERIZAR TABLAS OPERATIVAS (ARTÍCULOS CRÍTICOS Y FRECUENCIA)
function renderizarTablasDetalle(data) {
    // TABLA 1: TOP 5 ARTÍCULOS CON MÁS PERDIDA (COSTO NEGATIVO)
    const artPerdidas = {};
    data.forEach(item => {
        if (item.fisico_neg_cost > 0) {
            const key = `${item.articulo}__${item.articulo_descripcion}__${item.bodega_descripcion}`;
            if (!artPerdidas[key]) {
                artPerdidas[key] = {
                    cod: item.articulo,
                    desc: item.articulo_descripcion,
                    bodega: item.bodega_descripcion,
                    units: 0,
                    cost: 0
                };
            }
            artPerdidas[key].units += item.fisico_neg_unds;
            artPerdidas[key].cost += item.fisico_neg_cost;
        }
    });

    const sortedArtPerdidas = Object.values(artPerdidas)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);

    const tbodyPerdidas = document.getElementById("tbl_articulos_perdidas");
    tbodyPerdidas.innerHTML = "";

    sortedArtPerdidas.forEach(art => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${art.cod}</b></td>
            <td>${art.desc}</td>
            <td>${art.bodega}</td>
            <td>${formatNumber(art.units)}</td>
            <td class="text-red"><b>${formatCurrency(art.cost)}</b></td>
        `;
        tbodyPerdidas.appendChild(tr);
    });

    if (tbodyPerdidas.innerHTML === "") {
        tbodyPerdidas.innerHTML = `<tr><td colspan="5" class="center-align text-muted">Sin artículos reportados con faltantes</td></tr>`;
    }

    // TABLA 2: FRECUENCIA DE AJUSTES POR ARTÍCULO (COUNT DE TRANSACCIONES AFECTADAS)
    const artFreq = {};
    data.forEach(item => {
        if (item.fisico_neg_unds > 0 || item.fisico_pos_unds > 0) {
            const key = `${item.articulo}__${item.articulo_descripcion}`;
            if (!artFreq[key]) {
                artFreq[key] = {
                    cod: item.articulo,
                    desc: item.articulo_descripcion,
                    ajustesCount: 0,
                    totalUnds: 0
                };
            }
            // Cada mes con ajustes suma 1 al conteo operativo
            artFreq[key].ajustesCount++;
            artFreq[key].totalUnds += (item.fisico_pos_unds + item.fisico_neg_unds);
        }
    });

    const sortedArtFreq = Object.values(artFreq)
        .sort((a, b) => b.ajustesCount - a.ajustesCount)
        .slice(0, 5);

    const tbodyFreq = document.getElementById("tbl_frecuencia_ajustes");
    tbodyFreq.innerHTML = "";

    sortedArtFreq.forEach(art => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${art.cod}</b></td>
            <td>${art.desc}</td>
            <td class="center-align"><b>${art.ajustesCount}</b></td>
            <td>${formatNumber(art.totalUnds)}</td>
        `;
        tbodyFreq.appendChild(tr);
    });

    if (tbodyFreq.innerHTML === "") {
        tbodyFreq.innerHTML = `<tr><td colspan="4" class="center-align text-muted">Sin artículos ajustados</td></tr>`;
    }
}

// 7. RENDERIZAR GAUGE DE DISTRIBUCION (POSITIVOS vs NEGATIVOS)
function renderizarDistribucionGauge(data) {
    let totalPosCost = 0;
    let totalNegCost = 0;

    data.forEach(item => {
        totalPosCost += item.fisico_pos_cost;
        totalNegCost += item.fisico_neg_cost;
    });

    const sumCost = totalPosCost + totalNegCost;
    const pctPos = sumCost > 0 ? (totalPosCost / sumCost * 100) : 0;
    const pctNeg = sumCost > 0 ? (totalNegCost / sumCost * 100) : 0;

    // Actualizar leyendas numéricas del DOM
    document.getElementById("gauge_pct_positivos").innerText = pctPos.toFixed(2) + "%";
    document.getElementById("gauge_pct_negativos").innerText = pctNeg.toFixed(2) + "%";

    const ctxGauge = document.getElementById("chartDistribucionGauge").getContext("2d");
    if (chartDistribucionGauge) chartDistribucionGauge.destroy();

    chartDistribucionGauge = new Chart(ctxGauge, {
        type: 'doughnut',
        data: {
            labels: ['Ajustes Negativos', 'Ajustes Positivos'],
            datasets: [{
                data: [pctNeg, pctPos],
                backgroundColor: ['#ef4444', '#10b981'],
                borderWidth: 0,
                cutout: '72%',
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw.toFixed(2)}%`
                    }
                }
            }
        }
    });
}

// EXPORTAR DATOS DEL DASHBOARD A EXCEL (PRESERVANDO CEROS A LA IZQUIERDA)
function exportarDatos() {
    const data = allAdjustmentsData;
    if (data.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay información en el dashboard para exportar.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    // Cabeceras y filas en formato HTML con estilos específicos para MS Excel
    let html = `
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
            th { background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: left; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
            /* Estilo especial de Excel para forzar formato de celda como Texto */
            .text-cell { mso-number-format: "\\@"; }
        </style>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>Bodega</th>
                    <th>Bodega Descripción</th>
                    <th>Artículo</th>
                    <th>Artículo Descripción</th>
                    <th>Año</th>
                    <th>Mes</th>
                    <th>Clasificación 1</th>
                    <th>Físico Pos Unidades</th>
                    <th>Físico Neg Unidades</th>
                    <th>Físico Neto Unidades</th>
                    <th>Físico Pos Costo</th>
                    <th>Físico Neg Costo</th>
                    <th>Físico Neto Costo</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(r => {
        html += `
            <tr>
                <td class="text-cell">${r.bodega}</td>
                <td>${r.bodega_descripcion}</td>
                <td class="text-cell">${r.articulo}</td>
                <td>${r.articulo_descripcion}</td>
                <td>${r.anio}</td>
                <td>${r.mes}</td>
                <td class="text-cell">${r.clasificacion_1}</td>
                <td>${r.fisico_pos_unds}</td>
                <td>${r.fisico_neg_unds}</td>
                <td>${r.fisico_neto_unds}</td>
                <td>${r.fisico_pos_cost}</td>
                <td>${r.fisico_neg_cost}</td>
                <td>${r.fisico_neto_cost}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    // Crear un Blob con el contenido HTML y tipo MIME para Excel
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Control_Ajustes_Fisicos_Inventario_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Swal.fire({
        icon: 'success',
        title: '¡Exportación Exitosa!',
        text: 'Los datos del período seleccionado se han descargado en formato Excel.',
        timer: 2000,
        showConfirmButton: false
    });
}

// FORMATEADORES AUXILIARES
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

function mostrarModalFormula(costoActual = null, inventarioActual = null, costoAnterior = null, impactoActual = null, impactoAnterior = null, variacion = null) {
    let calculosDinamicosHtml = "";

    if (costoActual !== null && inventarioActual !== null && costoAnterior !== null) {
        calculosDinamicosHtml = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 18px; font-size: 0.88rem; color: #334155; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
                <p style="margin: 0 0 8px 0; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Valores de la consulta actual:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin-bottom: 10px;">
                    <div><span style="color: #64748b; font-size: 0.8rem; display:block;">Costo Ajustes Actual (abs)</span> <strong>${formatCurrency(costoActual)}</strong></div>
                    <div><span style="color: #64748b; font-size: 0.8rem; display:block;">Inventario Promedio Actual</span> <strong>${formatCurrency(inventarioActual)}</strong></div>
                    <div><span style="color: #64748b; font-size: 0.8rem; display:block;">Costo Ajustes Anterior (abs)</span> <strong>${formatCurrency(costoAnterior)}</strong></div>
                    <div></div>
                </div>
                <p style="margin: 8px 0 8px 0; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Cálculos realizados:</p>
                <div style="line-height: 1.4; font-family: monospace; font-size: 0.82rem; background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div><strong>Imp. Actual:</strong> (${formatNumber(costoActual)} / ${formatNumber(inventarioActual)}) * 100 = <strong>${impactoActual.toFixed(2)}%</strong></div>
                    <div><strong>Imp. Anterior:</strong> (${formatNumber(costoAnterior)} / ${formatNumber(inventarioActual)}) * 100 = <strong>${impactoAnterior.toFixed(2)}%</strong></div>
                    <div style="border-top: 1px dashed #cbd5e1; margin-top: 4px; padding-top: 4px;"><strong>Variación:</strong> ${impactoActual.toFixed(2)}% - ${impactoAnterior.toFixed(2)}% = <strong style="color: ${variacion <= 0 ? '#10b981' : '#ef4444'}">${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%</strong></div>
                </div>
            </div>
        `;
    }

    Swal.fire({
        title: '<strong>Fórmulas y Detalle de Cálculos</strong>',
        icon: 'info',
        html: `
            <div style="text-align: left; font-family: 'Outfit', sans-serif; font-size: 0.95rem; line-height: 1.5; color: #1e293b;">
                ${calculosDinamicosHtml}
                
                <p style="margin-bottom: 6px;"><strong>1. Impacto sobre Inventario Actual (%):</strong></p>
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; margin-bottom: 6px; border-left: 4px solid #8b5cf6; color: #0f172a;">
                    ((Costo Positivo + Costo Negativo) / Costo Promedio Inventario) * 100
                </div>
                <p style="color: #64748b; font-size: 0.8rem; margin-bottom: 16px; line-height: 1.3;">
                    * Se calcula usando la suma de los valores absolutos de todos los desvíos (tanto sobrantes como faltantes) del período actual.
                </p>

                <p style="margin-bottom: 6px;"><strong>2. Impacto Período Anterior (%):</strong></p>
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; margin-bottom: 6px; border-left: 4px solid #8b5cf6; color: #0f172a;">
                    (abs(Ajuste Neto Período Anterior) / Costo Promedio Inventario) * 100
                </div>
                <p style="color: #64748b; font-size: 0.8rem; margin-bottom: 16px; line-height: 1.3;">
                    * Se calcula dividiendo el costo del ajuste anterior por el valor del inventario actual fijo (para una comparación de impacto justa bajo la base de stock actual).
                </p>

                <p style="margin-bottom: 6px;"><strong>3. Variación vs Período Anterior (%):</strong></p>
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; margin-bottom: 6px; border-left: 4px solid #8b5cf6; color: #0f172a;">
                    Impacto Actual (%) - Impacto Anterior (%)
                </div>
                <p style="margin-bottom: 4px;"><strong>Significado del resultado:</strong></p>
                <ul style="padding-left: 18px; list-style-type: disc; margin: 0; font-size: 0.88rem; line-height: 1.3;">
                    <li style="margin-bottom: 4px;"><span style="color: #10b981; font-weight: 600;">Variación ≤ 0 (Verde / flecha abajo):</span> El impacto porcentual bajó, indicando una <strong>mejora operativa</strong> (menores desviaciones).</li>
                    <li><span style="color: #ef4444; font-weight: 600;">Variación > 0 (Rojo / flecha arriba):</span> El impacto porcentual aumentó, indicando un incremento de desviaciones.</li>
                </ul>
            </div>
        `,
        showCloseButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#8b5cf6'
    });
}