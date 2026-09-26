/**
 * js/version-checker.js
 * Monitor de versión en vivo para el WMS
 */
(function () {
  const CHECK_INTERVAL = 45 * 1000; // Comprobación cada 45 segundos
  let actualizacionPendiente = false;

  async function verificarNuevaVersion() {
    if (actualizacionPendiente) return;

    try {
      // Parámetro de tiempo único y headers anti-caché estrictos
      const res = await fetch(`version.json?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });

      if (!res.ok) return;
      const data = await res.json();
      const versionRemota = String(data.version || "").trim();
      const versionLocal = String(localStorage.getItem("wms_app_version") || "").trim();

      if (!versionRemota) return;

      // Primera vez que se abre la app en este equipo o dispositivo
      if (!versionLocal) {
        localStorage.setItem("wms_app_version", versionRemota);
        return;
      }

      // Si se subió una nueva versión al servidor
      if (versionRemota !== versionLocal) {
        actualizacionPendiente = true;
        console.warn(`[WMS] Nueva versión detectada: ${versionRemota} (Actual: ${versionLocal})`);

        if (typeof Swal !== "undefined") {
          Swal.fire({
            title: "¡Nueva Versión Disponible!",
            html: `
              <div style="font-size: 13.5px; line-height: 1.5; color: #475569;">
                Se ha publicado la versión <b>v${versionRemota}</b> del sistema WMS.<br>
                ${data.descripcion ? `<p style="margin: 8px 0; color: #1b676b;"><em>${data.descripcion}</em></p>` : ""}
                Presione <b>Actualizar ahora</b> para cargar las últimas mejoras.
              </div>
            `,
            icon: "info",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: false,
            confirmButtonText: "Actualizar ahora",
            confirmButtonColor: "#28a745"
          }).then((result) => {
            if (result.isConfirmed) {
              aplicarActualizacion(versionRemota);
            }
          });
        } else {
          if (confirm(`Nueva versión v${versionRemota} disponible. ¿Desea actualizar ahora?`)) {
            aplicarActualizacion(versionRemota);
          }
        }
      }
    } catch (e) {
      console.warn("[WMS] Error al consultar version.json:", e);
    }
  }

  async function aplicarActualizacion(nuevaVersion) {
    // 1. Persistir la nueva versión antes de reiniciar
    localStorage.setItem("wms_app_version", nuevaVersion);

    // 2. Limpiar Service Workers y CacheStorage si existen en el navegador
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (err) {
        console.warn("[WMS] Error limpiando CacheStorage:", err);
      }
    }

    // 3. Forzado real de caché: Reemplazar URL con token de actualización
    const url = new URL(window.location.href);
    url.searchParams.set("wms_refresh", `${nuevaVersion}_${Date.now()}`);
    window.location.replace(url.toString());
  }

  // Comprobar al iniciar y mantener sondeo regular
  document.addEventListener("DOMContentLoaded", () => {
    verificarNuevaVersion();
    setInterval(verificarNuevaVersion, CHECK_INTERVAL);
  });
})();