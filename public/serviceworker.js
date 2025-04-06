var staticCacheName = "eyojana";

// Install event
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(staticCacheName).then(function (cache) {
      return cache.addAll(["/"]);
    })
  );
});

// Fetch event (Cache First)
self.addEventListener("fetch", function (event) {
  console.log("[Service Worker] Fetching:", event.request.url);

  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

// Push event
self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push received");

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Push data was not JSON", e);
    }
  }

  const title = data.title || "Eyojana Notification";
  const options = {
    body: data.message || "You have a new message.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72x72.png"
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Sync event (Background Sync)
self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Sync event:", event.tag);

  if (event.tag === "test-tag-from-devtools") {
    event.waitUntil(
      // This is just a placeholder; replace with your actual sync logic
      fetch("/sync-endpoint", {
        method: "POST",
        body: JSON.stringify({ synced: true }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Sync completed successfully:", data);
        })
        .catch((error) => {
          console.error("Sync failed:", error);
        })
    );
  }
});

// Background fetch (optional scaffold)
self.addEventListener("backgroundfetchsuccess", (event) => {
  console.log("[Service Worker] Background Fetch Success:", event.registration.id);
  // You can cache fetched resources or notify the user
});

self.addEventListener("backgroundfetchfail", (event) => {
  console.error("[Service Worker] Background Fetch Failed:", event.registration.id);
});

self.addEventListener("backgroundfetchabort", (event) => {
  console.warn("[Service Worker] Background Fetch Aborted:", event.registration.id);
});
