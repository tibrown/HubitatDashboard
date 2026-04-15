import { useState } from 'react'

/** Persists collapse state to localStorage per key. Starts expanded by default. */
export function useCollapsed(key: string, defaultCollapsed = false): [boolean, () => void] {
  const storageKey = `tile-collapsed:${key}`
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored !== null ? stored === 'true' : defaultCollapsed
    } catch {
      return defaultCollapsed
    }
  })

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem(storageKey, String(next)) } catch { /* noop */ }
      return next
    })
  }

  return [collapsed, toggle]
}
