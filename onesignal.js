// onesignal.js
// Ganti jika perlu: ONESIGNAL_APP_ID sudah diisi sesuai permintaanmu
const ONESIGNAL_APP_ID = "a20e96d1-3c46-4a14-8d1f-1e69107149c7";

// Jika nanti mau kirim ke server, ganti SERVER_SAVE_ENDPOINT dengan URL endpoint yang benar.
// NOTE: GitHub Pages (https://rekanusaha.github.io/...) TIDAK bisa menerima POST.
const SERVER_SAVE_ENDPOINT = null; // contoh: "https://yourserver.com/save-onesignal"
// Untuk testing cepat, kamu bisa set ke webhook.site URL sementara, mis: "https://webhook.site/xxxx-xxxx"

(function(){
  // Safety: jangan override jika ada fungsi lain
  if (window.median_onesignal_info_original) return;
  window.median_onesignal_info_original = true;

  function sendToServerIfConfigured(payload){
    if (!SERVER_SAVE_ENDPOINT) return Promise.resolve({ skipped: true });
    // Pastikan endpoint https dan CORS mengizinkan request dari app
    return fetch(SERVER_SAVE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(res => {
      // jangan throw kalau res tidak json
      return res.text().then(txt => ({ status: res.status, text: txt }));
    });
  }

  // Fungsi yang akan dipanggil otomatis oleh app Median (jika ada)
  window.median_onesignal_info = function(oneSignalInfo) {
    try {
      console.log("[onesignal.js] median_onesignal_info called:", oneSignalInfo);
      const playerId = oneSignalInfo.oneSignalUserId || oneSignalInfo.oneSignalId || null;
      // simpan di localStorage agar bisa dicek/diambil nanti
      if (playerId) {
        localStorage.setItem("onesignal_player_id", playerId);
        localStorage.setItem("onesignal_app_id", ONESIGNAL_APP_ID);
      }

      // contoh ambil user id dari localStorage (jika kamu simpan login user di sana)
      const userId = localStorage.getItem("user_id") || null;

      // payload yang bisa dikirim ke server jika punya endpoint aktif
      const payload = { userId: userId, player_id: playerId, app_id: ONESIGNAL_APP_ID, timestamp: new Date().toISOString() };

      // coba kirim ke server kalau sudah dikonfigurasikan
      sendToServerIfConfigured(payload)
        .then(r => {
          if (r && r.skipped) {
            console.log("[onesignal.js] server send skipped (no SERVER_SAVE_ENDPOINT)");
          } else {
            console.log("[onesignal.js] server response", r);
          }
        })
        .catch(err => console.error("[onesignal.js] error sending to server", err));

    } catch (e) {
      console.error("[onesignal.js] exception in median_onesignal_info", e);
    }
  };

  // helper: fungsi untuk baca player id dari localStorage (bisa dipanggil dari console)
  window.getSavedOneSignalPlayerId = function(){
    return localStorage.getItem("onesignal_player_id");
  };

  // helper: fungsi untuk force-send ke server manual dari console (jika SERVER_SAVE_ENDPOINT diisi)
  window.sendSavedPlayerIdToServer = function(){
    const player = getSavedOneSignalPlayerId();
    const userId = localStorage.getItem("user_id") || null;
    if (!player) return Promise.reject(new Error("no player id saved"));
    const p = { userId, player_id: player, app_id: ONESIGNAL_APP_ID, timestamp: new Date().toISOString() };
    return sendToServerIfConfigured(p);
  };

})();
