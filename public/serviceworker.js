const staticCacheName = "eyojana-v1";

// INSTALL EVENT
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(["/"]); // Cache homepage
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
      return cachedRes || fetch(event.request);
    })
  );
});

// PUSH EVENT
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received");
  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    console.error("Error parsing push data", err);
  }

  const title = data.title || "E-Yojana Alert!";
  const options = {
    body: data.message || "You have a new update.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72x72.png"
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// SYNC EVENT
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Sync event triggered:", event.tag);

  if (event.tag === "yojana-sync") {
    event.waitUntil(
      fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify({ synced: true }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then((res) => res.json())
        .then((data) => console.log("Sync successful:", data))
        .catch((err) => console.error("Sync failed:", err))
    );
  }
});
