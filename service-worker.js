const CACHE_NAME = 'fitness-tracker-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.log('缓存失败:', err);
      })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求并优先使用缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到，直接返回
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request)
          .then((networkResponse) => {
            // 只缓存同源请求
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // 克隆响应（响应流只能读取一次）
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // 网络请求失败时返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 后台同步（用于离线时记录的数据同步）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-exercise-data') {
    event.waitUntil(syncExerciseData());
  }
});

// 推送通知（可选功能）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect fill=\'%23FF6B35\' width=\'192\' height=\'192\' rx=\'30\'/%3E%3Ctext x=\'96\' y=\'125\' font-size=\'100\' text-anchor=\'middle\' fill=\'white\'%3E🏃%3C/text%3E%3C/svg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect fill=\'%23FF6B35\' width=\'192\' height=\'192\' rx=\'30\'/%3E%3Ctext x=\'96\' y=\'125\' font-size=\'100\' text-anchor=\'middle\' fill=\'white\'%3E🏃%3C/text%3E%3C/svg%3E',
        tag: data.tag || 'exercise-reminder',
        requireInteraction: false
      })
    );
  }
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// 同步运动数据的辅助函数
async function syncExerciseData() {
  // 这里可以实现与后端同步的逻辑
  // 对于纯本地应用，此函数可以为空
  console.log('数据同步完成');
}
