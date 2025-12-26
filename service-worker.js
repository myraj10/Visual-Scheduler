const CACHE_NAME = 'visual-scheduler-cache-v3';
const urlsToCache = [
  '/Visual-Scheduler/index.html',
  '/Visual-Scheduler/manifest.json',
  '/Visual-Scheduler/assets/sounds/applause.mp3',
  '/Visual-Scheduler/icons/icon-192.png',
  '/Visual-Scheduler/icons/icon-512.png',
  // Caching all default task images for offline use
  '/Visual-Scheduler/assets/images/defaults/wake_up.png',
  '/Visual-Scheduler/assets/images/defaults/dress_up.png',
  '/Visual-Scheduler/assets/images/defaults/wash_hands.png',
  '/Visual-Scheduler/assets/images/defaults/comb_hair.png',
  '/Visual-Scheduler/assets/images/defaults/bus_ride.png',
  '/Visual-Scheduler/assets/images/defaults/drawing.png',
  '/Visual-Scheduler/assets/images/defaults/ride_bicycle.png',
  '/Visual-Scheduler/assets/images/defaults/breakfast.png',
  '/Visual-Scheduler/assets/images/defaults/shower.png',
  '/Visual-Scheduler/assets/images/defaults/brush_teeth.png',
  '/Visual-Scheduler/assets/images/defaults/school.png',
  '/Visual-Scheduler/assets/images/defaults/lunch.png',
  '/Visual-Scheduler/assets/images/defaults/sports.png',
  '/Visual-Scheduler/assets/images/defaults/go_home.png',
  '/Visual-Scheduler/assets/images/defaults/parent_pick_up.png',
  '/Visual-Scheduler/assets/images/defaults/clean_room.png',
  '/Visual-Scheduler/assets/images/defaults/homework.png',
  '/Visual-Scheduler/assets/images/defaults/play_games.png',
  '/Visual-Scheduler/assets/images/defaults/go_to_sleep.png',
  '/Visual-Scheduler/assets/images/defaults/walk_with_a_dog.png',
  '/Visual-Scheduler/assets/images/defaults/default.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Using addAll which is atomic: if one file fails, the whole operation fails.
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request); // Otherwise, fetch from network
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Deleting old caches
          }
        })
      );
    })
  );
});
