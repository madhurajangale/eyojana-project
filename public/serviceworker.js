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
      // Return cached response if found
      if (cachedRes) {
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return cachedRes;
      }

      // Otherwise, fetch from network and cache it
      return fetch(event.request).then((networkRes) => {
        return caches.open("eyojana-dynamic").then((cache) => {
          cache.put(event.request, networkRes.clone());
          console.log("[Service Worker] Fetched & cached:", event.request.url);
          return networkRes;
        });
      });
    }).catch(() => {
      // Optional: return offline fallback page
      return caches.match("/offline.html");
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
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.text(); // Use text to avoid crash if body is empty
        })
        .then((text) => {
          try {
            const data = JSON.parse(text); // Try parsing only if there's content
            console.log("Sync successful:", data);
          } catch (e) {
            console.warn("Response not valid JSON:", text);
          }
        })
        .catch((err) => console.error("Sync failed:", err))
    );
  }
});

