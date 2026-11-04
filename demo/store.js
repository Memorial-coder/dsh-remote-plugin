import React, { useSyncExternalStore } from 'react'

// 极简 defineStore（dsh-client-store 的演示替身）：init + actions + useStore(selector)。
// 用 useSyncExternalStore + 按 selector 缓存的快照，保证同一 (selector, state) 返回稳定引用，
// 避免"每次渲染新 selector → 重算 → 引用变化 → 无限重渲"。
export function defineStore(def) {
  let state = def.init()
  const listeners = new Set()
  const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
  const snapCache = new WeakMap() // selector -> { state, value }
  const getSnapshot = (selector) => {
    const select = selector || ((s) => s)
    let e = snapCache.get(select)
    if (!e || e.state !== state) {
      e = { state, value: select(state) }
      snapCache.set(select, e)
    }
    return e.value
  }
  const actions = {}
  for (const k of Object.keys(def.actions || {})) {
    actions[k] = (...args) => {
      const next = { ...state }
      def.actions[k](next, ...args)
      state = next
      listeners.forEach((l) => l())
    }
  }
  const useStore = (selector) => useSyncExternalStore(subscribe, () => getSnapshot(selector))
  return { useStore, actions, getState: () => state }
}
