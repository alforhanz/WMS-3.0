// Detectar automáticamente el host desde el cual se cargó la aplicación
const currentHost = window.location.hostname;
const isDalbosDomain = currentHost.includes("dalbos.com");

// Si es dominio dalbos.com, priorizar SIEMPRE el currentHost (para evitar el bloqueo CORS por Private Network Access)
const API_CANDIDATES = isDalbosDomain
  ? [
      `http://${currentHost}:8106`, // <-- Movido al primer lugar
      "http://api.dalbos.com",
      "http://10.246.28.5:8106"
    ]
  : [
      `http://${currentHost}:8106`,
      "http://10.246.28.5:8106",
      "http://api.dalbos.com"
    ];

// Limpiar IPs viejas guardadas en localStorage si existieran
let SAVED_API = localStorage.getItem("WORKING_API");
if (SAVED_API && (SAVED_API.includes("192.168.3.8") || SAVED_API.includes("190.60.19.210"))) {
  localStorage.removeItem("WORKING_API");
  localStorage.removeItem("WORKING_API_V2");
  SAVED_API = null;
}

// Inicializar de inmediato con el mejor candidato según el origen
let INITIAL_API = SAVED_API || API_CANDIDATES[0];

window.env = {
  ENVIRONMENT: "production",
  API_URL: INITIAL_API.replace(/\/+$/, "") + "/",
  API_IMAGE: INITIAL_API.replace(/\/+$/, "") + "/image",
};
var env = window.env;

async function testConnection(baseUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seg timeout

  try {
    await fetch(baseUrl, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    return false;
  }
}

// Promesa global para sincronizar con los demás scripts
window.envReady = (async function initEnvironment() {
  // Si la IP inicial ya era funcional (o guardada), hacemos prueba veloz
  for (const baseUrl of API_CANDIDATES) {
    console.log(`Probando conexión con: ${baseUrl}...`);
    const isAlive = await testConnection(baseUrl);

    if (isAlive) {
      console.log(`✅ Servidor activo seleccionado: ${baseUrl}`);
      window.env.API_URL = `${baseUrl}/`;
      window.env.API_IMAGE = `${baseUrl}/image`;

      // Guardamos la IP activa para futuros refrescos de página
      localStorage.setItem("WORKING_API", baseUrl);
      return baseUrl;
    } else {
      console.warn(`❌ Servidor inaccesible: ${baseUrl}`);
    }
  }

  console.error("⚠️ Ningún servidor respondió. Se mantiene la IP por defecto.");
})();

// Variables secundarias globales
window.Host = localStorage.getItem("Host");
window.myHeaders = { "Content-Type": "application/json", Accept: "application/json" };
window.myInit = { method: "GET", headers: window.myHeaders, mode: "cors", cache: "default" };
window.myInitDEL = {
  method: "DELETE",
  cache: "no-cache",
  headers: { "Content-Type": "application/json;charset=UTF-8", Accept: "application/json" },
};
window.currencies = {
  USD: { code: "USD", symbol: "&#36;", name: "US Dollar" },
  BTC: { code: "BTC", symbol: " BTC", name: "Bitcoin", accuracy: 4, after: true },
};
window.settings = { checkout: { type: "PayPal", email: "you@yours.com" }, currency: "USD", language: "spanish-es", excludeFromCheckout: ["thumb"], data: {} };

// const Host = localStorage.getItem("Host");

// const env = {
//   ENVIRONMENT: "development",
//   API_URL: "http://190.60.19.210:8097/",
//   API_IMAGE: "http://190.60.19.210:8097/" + "image",
// };
// const myHeaders = {
//   "Content-Type": "application/json",
//   Accept: "application/json",
// };
// const myInit = {
//   method: "GET",
//   headers: myHeaders,
//   mode: "cors",
//   cache: "default",
// };
// const myInitDEL = {
//   method: "DELETE", // *GET, POST, PUT, DELETE, etc.
//   cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//   headers: {
//     "Content-Type": "application/json;charset=UTF-8",
//     Accept: "application/json",
//   },
// };
// const currencies = {
//   USD: { code: "USD", symbol: "&#36;", name: "US Dollar" },
//   BTC: {
//     code: "BTC",
//     symbol: " BTC",
//     name: "Bitcoin",
//     accuracy: 4,
//     after: true,
//   },
// };
// // default options
// const settings = {
//   checkout: { type: "PayPal", email: "you@yours.com" },
//   currency: "USD",
//   language: "spanish-es",
//   excludeFromCheckout: ["thumb"],
//   data: {},
// };
