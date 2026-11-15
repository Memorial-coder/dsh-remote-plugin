/* DSH 远程助手 · Service Worker
 * v1.0.0:纯透传(只为 PWA 可安装性存在,不做任何缓存)。
 * v1.1.0(2026-11-15, L1.5):合并设备密钥签名——同源请求自动带
 *   X-BC-Dev / X-BC-Ts / X-BC-Nonce / X-BC-Dev-Sig 头(HMAC-SHA256)。
 *  - 密钥存 IndexedDB('bc-devkey'),由引导页(/dev-boot)写入,从不过服务器;
 *  - 无密钥时纯透传(宽容期/引导期);闸机对无签名请求返回引导页完成装机闭环;
 *  - 豁免:/dev-bind /dev-boot(引导通道本身,其防护是 bc-gate 会话 cookie);
 *  - WebSocket 握手不经过 fetch handler,闸机侧对 Upgrade 请求豁免(靠 cookie 防护);
 *  - 仍不做任何 HTTP 缓存:面板 HTML/插件 API/闸机端点一律走网络,避免旧版本或
 *    鉴权过期被缓存卡住;iOS 主屏形态由 manifest + apple-touch-icon 提供。
 * 更新方式:修改本文件任意内容,浏览器下次访问会自动比对并激活新 SW。
 */
const SW_VERSION = '1.1.0'
var KV = { dev: '', key: '' }

function idb() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open('bc-devkey', 1)
    r.onupgradeneeded = function () { r.result.createObjectStore('kv') }
    r.onsuccess = function () { res(r.result) }
    r.onerror = function () { rej(r.error) }
  })
}
function idbGet(k) {
  return idb().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction('kv', 'readonly')
      var q = tx.objectStore('kv').get(k)
      q.onsuccess = function () { res(q.result) }
      q.onerror = function () { rej(q.error) }
    })
  })
}
function hex(buf) {
  var a = new Uint8Array(buf), s = ''
  for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2)
  return s
}
function sign(method, path) {
  var ts = Math.floor(Date.now() / 1000).toString()
  var n = ''
  var b = new Uint8Array(8)
  crypto.getRandomValues(b)
  for (var i = 0; i < b.length; i++) n += ('0' + b[i].toString(16)).slice(-2)
  var msg = new TextEncoder().encode(method + '\n' + path + '\n' + ts + '\n' + n)
  var raw = new Uint8Array(KV.key.match(/.{2}/g).map(function (h) { return parseInt(h, 16) }))
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(function (k) { return crypto.subtle.sign('HMAC', k, msg) })
    .then(function (mac) { return { ts: ts, nonce: n, sig: hex(mac) } })
}
/* 签名路径口径:剥掉 /p/<port>/ 前缀 + 去尾斜杠,与闸机 _dev_sig_verify 同一规范。 */
function normPath(url) {
  var p = new URL(url).pathname.replace(/\/+$/, '')
  return p.replace(/^\/p\/[0-9]+(?=\/)/, '')
}
var EXEMPT = ['/dev-bind', '/dev-boot']
function isExempt(p) {
  for (var i = 0; i < EXEMPT.length; i++) {
    if (p === EXEMPT[i]) return true
  }
  return false
}
function withSig(req, method, p, dev, key) {
  return sign(method, p).then(function (s) {
    var h = new Headers(req.headers)
    h.set('X-BC-Dev', dev)
    h.set('X-BC-Ts', s.ts)
    h.set('X-BC-Nonce', s.nonce)
    h.set('X-BC-Dev-Sig', s.sig)
    return fetch(new Request(req, { headers: h }))
  })
}

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

self.addEventListener('message', function (e) {
  var d = e.data || {}
  if (d.type === 'setKey') { KV.dev = d.dev; KV.key = d.key }
})

self.addEventListener('fetch', function (e) {
  var req = e.request
  var method = req.method.toUpperCase()
  if (req.url.indexOf(location.origin) !== 0) return // 跨域不签
  var p = normPath(req.url)
  if (isExempt(p)) return // 引导通道透传
  if (KV.key) {
    e.respondWith(withSig(req, method, p, KV.dev, KV.key))
  } else {
    // 密钥未进内存:试读一次 IndexedDB;读不到就透传(宽容期/引导期由闸机放行)
    e.respondWith(idbGet('key').then(function (key) {
      if (!key) return fetch(req)
      return idbGet('dev').then(function (dev) {
        KV.dev = dev; KV.key = key
        return withSig(req, method, p, dev, key)
      })
    }))
  }
})
