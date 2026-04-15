type ToastType = 'error' | 'info'
type ToastCallback = (message: string, type: ToastType) => void

const listeners: ToastCallback[] = []

export function showToast(message: string, type: ToastType = 'info'): void {
  for (const cb of listeners) {
    cb(message, type)
  }
}

export function onToast(callback: ToastCallback): () => void {
  listeners.push(callback)
  return () => {
    const idx = listeners.indexOf(callback)
    if (idx > -1) listeners.splice(idx, 1)
  }
}
