import { useState } from 'react'
import { useEditMode } from '../context/EditModeContext'

/** Persists collapse state to localStorage per key.
 *  Automatically force-expands while edit mode is active (via EditModeContext),
 *  then restores the persisted state when edit mode ends. */
export function useCollapsed(key: string, defaultCollapsed = false): [boolean, () => void] {
  const storageKey = `tile-collapsed:${key}`
  const editMode = useEditMode()
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

  // Force-expand during edit mode; persisted state is untouched
  return [editMode ? false : collapsed, toggle]
}
