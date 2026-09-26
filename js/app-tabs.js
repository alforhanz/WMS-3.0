// const GLOBAL_SESSION_KEY = "BREMEN_SESSION_ACTIVE";

// (function () {

//   const user = sessionStorage.getItem("user");
//   if (!user) return;

//   const username = JSON.parse(user);
//   const LOCK_KEY = "BREMEN_ACTIVE_TAB_" + username;
//   const CHANNEL_NAME = "bremen_tab_sync_" + username;

//   function generateTabId() {
//     return "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
//   }

//   const TAB_ID = sessionStorage.getItem("TAB_ID") || generateTabId();
//   sessionStorage.setItem("TAB_ID", TAB_ID);

//   const channel = new BroadcastChannel(CHANNEL_NAME);
//   let isBlocked = false;

//   // ======================
//   // UI BLOQUEO
//   // ======================
//   function blockTab() {
//     if (isBlocked) return;
//     isBlocked = true;

//     console.warn("⚠️ Pestaña bloqueada — sesión activa detectada");

//     document.documentElement.innerHTML = `
//       <head>
//         <title>Sesión activa</title>
//       </head>
//       <body style="margin:0;">
//         <div style="
//           display:flex;
//           justify-content:center;
//           align-items:center;
//           height:100vh;
//           background:linear-gradient(135deg,#f5f5f5,#eeeeee);
//           font-family:'Segoe UI',sans-serif;
//         ">
//           <div style="
//             background:#fff;
//             border-radius:16px;
//             padding:40px;
//             max-width:480px;
//             text-align:center;
//             box-shadow:0 10px 35px rgba(0,0,0,0.2);
//           ">
//             <div style="font-size:56px;color:#d32f2f;">⚠️</div>
//             <h2 style="color:#b71c1c;margin-bottom:10px;">
//               Sesión activa en otra pestaña
//             </h2>

//             <p style="color:#444;line-height:1.6;">
//               Esta cuenta ya está abierta en otra ventana del sistema.
//             </p>

//             <p style="font-weight:bold;margin-top:10px;">
//               Esta pestaña ha sido bloqueada por seguridad.
//             </p>

//             <button id="closeTabBtn" style="
//               margin-top:20px;
//               padding:12px 22px;
//               border-radius:10px;
//               border:none;
//               background:#f90f00;
//               color:white;
//               font-weight:700;
//               cursor:pointer;
//             ">
//               Cerrar esta pestaña
//             </button>
//           </div>
//         </div>
//       </body>
//     `;

//     document.getElementById("closeTabBtn").onclick = () => {
//       window.close();
//     };
//   }

//   // ======================
//   // RESPONDER PINGS SI SOY LÍDER
//   // ======================
//   channel.onmessage = (event) => {
//     const msg = event.data;

//     if (msg.type === "PING" && localStorage.getItem(LOCK_KEY) === TAB_ID) {
//       channel.postMessage({ type: "PONG", from: TAB_ID });
//     }
//   };

//   // ======================
//   // VALIDAR SI YA HAY LÍDER
//   // ======================
//   const currentLock = localStorage.getItem(LOCK_KEY);

//   if (currentLock && currentLock !== TAB_ID) {

//     let responded = false;

//     channel.postMessage({ type: "PING", from: TAB_ID });

//     const timeout = setTimeout(() => {
//       if (!responded) {
//         // líder muerto → tomar control
//         localStorage.setItem(LOCK_KEY, TAB_ID);
//       } else {
//         // líder vivo → bloquear esta pestaña
//         blockTab();
//       }
//     }, 700);

//     channel.addEventListener("message", (event) => {
//       const msg = event.data;

//       if (msg.type === "PONG" && msg.from !== TAB_ID) {
//         responded = true;
//       }
//     });

//   } else {
//     // No hay líder → tomar control
//     localStorage.setItem(LOCK_KEY, TAB_ID);
//   }

//   // ======================
//   // HEARTBEAT (mantener liderazgo)
//   // ======================
//   const heartbeat = setInterval(() => {
//     if (localStorage.getItem(LOCK_KEY) === TAB_ID) {
//       localStorage.setItem(LOCK_KEY, TAB_ID);
//     }
//   }, 2000);

//   // ======================
//   // LIBERAR AL CERRAR
//   // ======================
//   window.addEventListener("beforeunload", () => {
//     if (localStorage.getItem(LOCK_KEY) === TAB_ID) {
//       localStorage.removeItem(LOCK_KEY);
//     }

//     channel.close();
//     clearInterval(heartbeat);
//   });

// })();

// console.log("APP-TABS CARGADO EN:", location.pathname);
