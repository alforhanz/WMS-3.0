// /**
//  * js/autoloader.js
//  * Auto-cargador de scripts locales para manejo dinámico de caché (Cache Busting)
//  */
// (function() {
//     const version = localStorage.getItem("wms_app_version") || Date.now();
//     const currentScript = document.currentScript;
//     if (!currentScript) return;

//     const scriptsStr = currentScript.getAttribute("data-scripts");
//     if (!scriptsStr) return;

//     const scriptNames = scriptsStr.split(",").map(s => s.trim()).filter(s => s !== "");
//     let loadedCount = 0;

//     scriptNames.forEach((name, index) => {
//         const s = document.createElement("script");
//         s.src = `js/${name}?v=${version}`;
//         s.async = false; // Descarga en paralelo, ejecuta en orden estricto
        
//         s.onload = () => {
//             loadedCount++;
//             // Cuando termine de cargar TODOS los scripts, forzamos un evento "DOM listo artificial"
//             // para que funciones como 'existeBodega()' o inicializaciones de selectores se disparen
//             if (loadedCount === scriptNames.length) {
//                 console.log("[WMS Autoloader] Todos los scripts cargados correctamente.");
                
//                 // Disparamos evento general de inicialización
//                 const event = new Event('WMS_ScriptsLoaded');
//                 document.dispatchEvent(event);
//             }
//         };

//         document.body.appendChild(s);
//     });
// })();