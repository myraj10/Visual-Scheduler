const CACHE_NAME = 'visual-scheduler-cache-v2';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'assets/sounds/applause.mp3',
  'icons/icon-192.png',
  'icons/icon-512.png',
  // Add the paths to your default task images here
  'assets/images/defaults/wake_up.png',
  'assets/images/defaults/dress_up.png',
  'assets/images/defaults/wash_hands.png',
  'assets/images/defaults/comb_hair.png',
  'assets/images/defaults/bus_ride.png',
  'assets/images/defaults/drawing.png',
  'assets/images/defaults/ride_bicycle.png',
  'assets/images/defaults/breakfast.png',
  'assets/images/defaults/shower.png',
  'assets/images/defaults/brush_teeth.png',
  'assets/images/defaults/school.png',
  'assets/images/defaults/lunch.png',
  'assets/images/defaults/sports.png',
  'assets/images/defaults/go_home.png',
  'assets/images/defaults/parent_pick_up.png',
  'assets/images/defaults/clean_room.png',
  'assets/images/defaults/homework.png',
  'assets/images/defaults/play_games.png',
  'assets/images/defaults/go_to_sleep.png',
  'assets/images/defaults/walk_with_a_dog.png',
  'assets/images/defaults/default.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});