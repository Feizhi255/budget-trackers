const fileCacheName = "file-v1"
const dataCacheName = "data-v1"

const fileToCache = [
    "/",
    "/index.html",
    "/style.css",
    "/index.js",
    "/favicon.ico",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
]


// install lifecycle method
self.addEventListener('install', (event) => {
    console.log('hit install');
    event.waitUntil(
        caches
            .open(fileCacheName)
            .then(cache => {
                return cache.addAll(fileToCache);
            })
            .catch(error => console.log('error caching files on install: ', error))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("hit activation");

    event.waitUntil(
        caches
            .keys()
            .then(keyList => {
                return Promise.all(
                    keyList.map(key => {
                        // if current key does not equal current cahe name, delete it
                        if (key !== fileCacheName && key !== dataCacheName) {
                            console.log("delete cahe: ", key);
                            return caches.delete(key);
                        }
                    })
                );
            })
            .catch(error => console.log("activation error: ", error))
    );

    // if any open clients, update to active SW
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // console.log(event);

    // handle api caching
    if (event.request.url.includes("/api")) {
        return event.respondWith(
            caches
                .open(dataCacheName)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }

                            return response;
                        })
                        .catch(error => {
                            // network failed, use cached
                            return cache.match(event.request);
                        })
                })
                .catch(error => console.log("error fetching api: ", error))
        )
    }


    event.respondWith(
        caches
            .match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(error => console.log(error))
    )

});