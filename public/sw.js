// Service worker do painel administrativo.
// Responsabilidades: receber push e abrir o painel ao clicar na notificação.
// Não faz cache de dados — o painel precisa sempre de números atuais.

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let dados = { title: "Sniper Trader", body: "", url: "/admin" }
  try {
    if (event.data) dados = { ...dados, ...event.data.json() }
  } catch {
    if (event.data) dados.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      icon: "/logo.png",
      badge: "/icon.png",
      tag: dados.tag || "sniper",
      renotify: true,
      data: { url: dados.url || "/admin" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const destino = (event.notification.data && event.notification.data.url) || "/admin"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (janela.url.includes(destino) && "focus" in janela) return janela.focus()
      }
      return self.clients.openWindow(destino)
    }),
  )
})
