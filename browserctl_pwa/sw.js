/* DSH 远程助手 · Service Worker
 * v1.0.0:纯透传(只为 PWA 可安装性存在,不做任何缓存)。
 * v1.1.0(2026-11-15, L1.5):合并设备密钥签名——同源请求自动带
 *   X-BC-Dev / X-BC-Ts / X-BC-Nonce / X-BC-Dev-Sig 头(HMAC-SHA256)。
 * v1.2.0(2026-11-15, L2 非对称化):签名升级为 ECDSA P-256——
 *   - 设备端 crypto.subtle.generateKey 生成密钥对,私钥(优先)不可导出,存 IndexedDB;
 *   - 公钥经引导页 POST /dev-bind?pubkey= 登记到闸机,私钥永不出设备;
 *   - 闸机只存公钥验签:TLS 被截/服务器沦陷都拿不到可伪造签名的对称材料;
 *   - 双轨兼容:存量 SW 1.1.0 的 HMAC key(idb 'key')继续有效(闸机双轨验签),
 *     重装/新装机一律走 ECDSA;已登记公钥的设备闸机不再下发对称 key(防降级)。
 *  - 豁免:/dev-bind /dev-boot(引导通道本身,其防护是 bc-gate 会话 cookie);
 *  - WebSocket 握手不经过 fetch handler,闸机侧对 Upgrade 请求豁免(靠 cookie 防护);
 *  - 仍不做任何 HTTP 缓存:面板 HTML/插件 API/闸机端点一律走网络。
 * v1.2.2(2026-11-17, 绑定失效自愈):闸机踢下线会撤销设备密钥,本地旧凭证
 *   会让签名永远 401。fetch 拦到 401(JSON ok:false)连续 3 次 → 清 IndexedDB
 *   凭证 + 向页面广播 rebind → 页面清 sessionStorage 引导标记并跳 dev-boot 重装。
 * v1.2.5(2026-11-17, 引导页自愈):ping 回报 cred/dev,配合引导页 1.3.0 的
 *   「凭证已就绪→直接进面板 / 否则重装」判定,消除「凭证已安装过」死循环。
 * 更新方式:修改本文件任意内容,浏览器下次访问会自动比对并激活新 SW。
 */
const SW_VERSION = '1.2.5'
var KV = { dev: '', key: '', priv: null, privjwk: '', pub: '' }

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
function idbPut(k, v) {
  return idb().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(v, k)
      tx.oncomplete = function () { res() }
      tx.onerror = function () { rej(tx.error) }
    })
  })
}
function hex(buf) {
  var a = new Uint8Array(buf), s = ''
  for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2)
  return s
}
/* L2:生成 ECDSA P-256 密钥对。优先「非导出私钥」直存 IndexedDB(CryptoKey 可
 * structured-clone,拿不出原始字节,安全上限最高);个别环境存不了 CryptoKey 时
 * 降级为导出 JWK 字符串存(与存量 HMAC key 同级保护,不倒退)。 */
function genPair() {
  return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
    .then(function (kp) {
      return crypto.subtle.exportKey('raw', kp.publicKey).then(function (raw) {
        return idbPut('priv', kp.privateKey).then(function () { return idbPut('pub', hex(raw)) })
          .then(function () { KV.priv = kp.privateKey; KV.pub = hex(raw); return KV })
      })
    })
    .catch(function () {
      return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
        .then(function (kp) {
          return crypto.subtle.exportKey('jwk', kp.privateKey).then(function (jwk) {
            return idbPut('privjwk', JSON.stringify(jwk)).then(function () {
              return crypto.subtle.exportKey('raw', kp.publicKey)
            }).then(function (raw) {
              return idbPut('pub', hex(raw))
            }).then(function () {
              KV.privjwk = JSON.stringify(jwk); KV.pub = hex(raw); return KV
            })
          })
        })
    })
}
/* 装机状态就绪:优先 ECDSA(priv/privjwk+pub),退回存量 HMAC(key)。
 * v1.2.4 修复:ECDSA 分支原来只取 pub/priv,**没取 dev**——于是 X-BC-Dev 恒为空,
 * 闸机按「无签名」回引导页,页面重载后永远跳回「正在验证此设备」死循环
 * (2026-11-17 真浏览器实测:IndexedDB 有 bc-devkey 但面板永远 401)。 */
function loadCred() {
  if ((KV.priv || KV.privjwk) && KV.pub) return Promise.resolve(KV)
  if (KV.key) return Promise.resolve(KV)
  return idbGet('pub').then(function (pub) {
    if (!pub) throw new Error('no-cred')
    KV.pub = pub
    return idbGet('priv').then(function (k) {
      if (k) { KV.priv = k; return KV }
      return idbGet('privjwk').then(function (j) {
        if (j) { KV.privjwk = j; return KV }
        throw new Error('no-cred')
      })
    })
  }).catch(function () {
    return idbGet('key').then(function (key) {
      if (!key) throw new Error('no-cred')
      return idbGet('dev').then(function (dev) { KV.dev = dev; KV.key = key; return KV })
    })
  })
}
function ensureCred() {
  return loadCred().then(function (kv) {
    if (kv.dev) return kv
    return idbGet('dev').then(function (dev) {
      if (dev) kv.dev = dev
      return kv
    })
  })
}
function sign(method, path) {
  var ts = Math.floor(Date.now() / 1000).toString()
  var n = ''
  var b = new Uint8Array(8)
  crypto.getRandomValues(b)
  for (var i = 0; i < b.length; i++) n += ('0' + b[i].toString(16)).slice(-2)
  var msg = new TextEncoder().encode(method + '\n' + path + '\n' + ts + '\n' + n)
  if (KV.priv || KV.privjwk) {
    var kp = KV.priv
      ? Promise.resolve(KV.priv)
      : crypto.subtle.importKey('jwk', JSON.parse(KV.privjwk), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
    return kp.then(function (k) {
      return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, msg)
    }).then(function (sig) { return { ts: ts, nonce: n, sig: hex(sig) } })
  }
  var raw = new Uint8Array(KV.key.match(/.{2}/g).map(function (h) { return parseInt(h, 16) }))
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(function (k) { return crypto.subtle.sign('HMAC', k, msg) })
    .then(function (mac) { return { ts: ts, nonce: n, sig: hex(mac) } })
}
/* 签名路径口径:剥掉 /p/<port>/ 前缀 + 去尾斜杠,与闸机 _dev_sig_verify 同一规范。 */
function normPath(url) {
  var p = new URL(url).pathname.replace(/\/+$/, '')
  // 两种公网入口前缀都要剥: /p/<port>/ 与 uid 稳定形态 /dsh-remote/p/<uid>/
  // （dsh-remote 的 uid 代理按 restPath 转发，闸机根本看不到前缀；不剥=签名恒不匹配）
  var m = /^\/(?:[^/]+\/)?p\/[^/]+/.exec(p)
  if (m) p = p.slice(m[0].length)
  return p
}
var EXEMPT = ['/dev-bind', '/dev-boot']
/* 豁免口径与闸机 _SIG_EXEMPT 一致(endswith):引导通道原生放行(不 respondWith,
 * 浏览器默认网络栈自动带 SameSite cookie)。实测 respondWith(fetch(req)) 透传
 * 在部分内核会丢 SameSite=Lax cookie → dev-bind 401 装机死循环,必须原生放行。 */
function isExempt(p) {
  for (var i = 0; i < EXEMPT.length; i++) {
    if (p === EXEMPT[i] || p.endsWith(EXEMPT[i])) return true
  }
  return false
}
function withSig(req, method, p) {
  return sign(method, p).then(function (s) {
    var h = new Headers(req.headers)
    h.set('X-BC-Dev', KV.dev)
    h.set('X-BC-Ts', s.ts)
    h.set('X-BC-Nonce', s.nonce)
    h.set('X-BC-Dev-Sig', s.sig)
    return fetch(new Request(req, { headers: h }))
  })
}

/* ---- v1.2.2 绑定失效自愈 ----
 * 被踢撤销后闸机对旧凭证一律 401;计数连续 3 次即判定凭证失效:
 * 清 IndexedDB(priv/privjwk/pub/dev/key)→ KV 复位 → postMessage 通知页面重走引导。 */
var FAIL_KEY = 'sig_fail_streak'
var FAIL_LIMIT = 3
function failBump() {
  return idbGet(FAIL_KEY).then(function (n) {
    n = (n || 0) + 1
    return idbPut(FAIL_KEY, n).then(function () { return n })
  })
}
function healRevoke() {
  return idbGet(FAIL_KEY).then(function (n) {
    if ((n || 0) < FAIL_LIMIT) return false
    return Promise.all([
      idbPut(FAIL_KEY, 0), idbPut('priv', ''), idbPut('privjwk', ''),
      idbPut('pub', ''), idbPut('dev', ''), idbPut('key', '')
    ]).then(function () {
      KV = { dev: '', key: '', priv: null, privjwk: '', pub: '' }
      self.clients.matchAll({ includeUncontrolled: true }).then(function (cs) {
        cs.forEach(function (c) { c.postMessage({ type: 'rebind' }) })
      })
      return true
    })
  })
}
function looksGate401(resp) {
  if (resp.status !== 401) return false
  var ct = (resp.headers.get('content-type') || '')
  return ct.indexOf('json') >= 0 || ct.indexOf('html') >= 0
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
  if (d.type === 'ping' && e.ports && e.ports[0]) {
    /* v1.2.5:连凭证状态一起回报——引导页据此判断「直接进面板」还是「重装凭证」。
     * 没有它，页面只能盲装；遇到被踢/旧 SW 场景就会在引导页与面板之间来回跳。 */
    var port = e.ports[0]
    ensureCred().then(function (kv) {
      port.postMessage({
        ok: true, version: SW_VERSION, exempt: EXEMPT.slice(),
        cred: !!(kv && kv.dev && (kv.priv || kv.privjwk || kv.key)),
        dev: (kv && kv.dev) || ''
      })
    }, function () {
      port.postMessage({ ok: true, version: SW_VERSION, exempt: EXEMPT.slice(), cred: false, dev: '' })
    })
    return
  }
  if (d.type === 'setKey') { KV.dev = d.dev; KV.key = d.key }
  // L2:引导页通过 MessageChannel 请求生成密钥对并回传公钥 hex(65B 非压缩点)
  if (d.type === 'genkeys') {
    var port = e.ports && e.ports[0]
    if (!port) return
    genPair().then(function (kv) {
      return idbGet('dev').then(function (dev) { if (dev) KV.dev = dev }).then(function () {
        port.postMessage({ ok: true, pub: kv.pub, version: SW_VERSION })
      })
    }).catch(function (err) {
      port.postMessage({ ok: false, error: String(err && err.message || err) })
    })
  }
})

self.addEventListener('fetch', function (e) {
  var req = e.request
  var method = req.method.toUpperCase()
  if (req.url.indexOf(location.origin) !== 0) return // 跨域不签
  var p = normPath(req.url)
  if (isExempt(p)) return // 引导通道透传
  e.respondWith(ensureCred().then(function (kv) {
    return withSig(req, method, p).then(function (resp) {
      if (looksGate401(resp)) {
        // 克隆一份数 401(响应体留给页面);连到阈值就清凭证广播 rebind
        try {
          resp.clone().text().catch(function () {})
          failBump().then(function (n) { if (n >= FAIL_LIMIT) return healRevoke() })
        } catch (e2) {}
      } else if (resp.ok) {
        idbGet(FAIL_KEY).then(function (n) { if (n) idbPut(FAIL_KEY, 0) })
      }
      return resp
    })
  }, function () {
    // 无凭证(宽容期/引导期):透传,由闸机引导页完成装机闭环
    return fetch(req)
  }))
})
