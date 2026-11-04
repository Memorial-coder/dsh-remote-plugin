/* DSH 远程助手 · 极简 Service Worker
 * 只做「网络透传」,不做任何缓存:
 *  - 面板 HTML / 插件 API / 闸机端点一律走网络,避免旧版本或鉴权过期被缓存卡住;
 *  - iOS「添加到主屏幕」的独立全屏形态由 manifest + apple-touch-icon + meta 提供,
 *    SW 只是补齐 PWA 的「可安装」要求(对 iOS 影响有限)。
 * 更新方式:修改本文件任意内容,浏览器下次访问会自动比对并激活新 SW。
 */
const SW_VERSION = '1.0.0'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清理任何历史缓存(本 SW 从不写缓存,留作兜底,避免旧 SW 残留缓存)
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

// 不注册 fetch 处理器:浏览器按默认网络请求透传,面板永远拿最新内容。
