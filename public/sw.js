
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Ayamonte Cofrade', body: 'Nueva alerta disponible' };
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Asegúrate de tener un icono en public
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ver detalles' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
