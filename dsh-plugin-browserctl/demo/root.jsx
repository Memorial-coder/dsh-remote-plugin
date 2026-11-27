import React from 'react'
import { createRoot } from 'react-dom/client'
import { __demoPanel } from '../src/client.jsx'
import { defineStore } from './store.js'
import { installMockFetch } from './mock.js'
import localeZh from './locale.zh.js'

installMockFetch()
const { BrowserCtlOverlay, installStyles } = __demoPanel

function t(key, params) {
  let s = localeZh[key] != null ? localeZh[key] : key
  if (params) {
    for (const k of Object.keys(params)) s = s.split('{' + k + '}').join(String(params[k]))
  }
  return s
}

// 演示屏永不关闭；actions.close 置空，避免点蒙层/按 Esc 把面板关掉
const store = defineStore({
  init: () => ({ open: true }),
  actions: {
    open: (d) => { d.open = true },
    close: () => {},
  },
})

const initialTab = new URLSearchParams(window.location.search).get('tab') || 'connect'

installStyles()
createRoot(document.getElementById('root')).render(
  <BrowserCtlOverlay useStore={store.useStore} actions={store.actions} t={t} initialTab={initialTab} />
)
