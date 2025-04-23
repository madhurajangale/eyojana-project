const staticCacheName = "eyojana-v1";

// INSTALL EVENT
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("eyojana-static").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/app.js",
        "/offline.html"
      ]);
    })
  );
  self.skipWaiting();
});

// ACTIVATE EVENT
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  return self.clients.claim();
});

// FETCH EVENT
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      if (cachedRes) {
        console.log("[SW] Serving from cache:", event.request.url);
        return cachedRes;
      }
      return fetch(event.request).then((networkRes) => {
        return caches.open("eyojana-dynamic").then((cache) => {
          cache.put(event.request, networkRes.clone());
          console.log("[SW] Fetched & cached:", event.request.url);
          return networkRes;
        });
      });
    }).catch(() => caches.match("/offline.html"))
  );
});

// PUSH EVENT
self.addEventListener("push", (event) => {
  console.log("[SW] Push Received");

  let data = {};
  try {
    if (event.data) {
      const text = event.data.text();
      try {
        data = JSON.parse(text); // Parse as JSON if possible
      } catch {
        data = { title: "Notification", body: text }; // Fallback to plain text
      }
    }
  } catch (err) {
    console.error("[SW] Error parsing push data", err);
  }

  // Only Title and Message fields
  const title = data.title || "E-Yojana Alert!";
  const options = {
    body: data.body || "You have a new update.",
    // No icon and badge fields
  };

  console.log("[SW] Showing notification:", title, options);

  // Show notification only if permission is granted
  if (Notification.permission === "granted") {
    event.waitUntil(self.registration.showNotification(title, options));
  } else {
    console.warn("[SW] Notification permission not granted.");
  }
});

// NOTIFICATION CLICK EVENT
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click received:", event.notification.data);
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});

// SYNC EVENT
self.addEventListener("sync", (event) => {
  console.log("[SW] Sync event triggered:", event.tag);
  if (event.tag === "yojana-sync") {
    event.waitUntil(
      fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify({ synced: true }),
        headers: { "Content-Type": "application/json" }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.text();
        })
        .then((text) => {
          try {
            console.log("[SW] Sync successful:", JSON.parse(text));
          } catch {
            console.warn("[SW] Sync response not valid JSON:", text);
          }
        })
        .catch((err) => console.error("[SW] Sync failed:", err))
    );
  }
});
