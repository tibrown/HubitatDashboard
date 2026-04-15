import { useEffect, useState } from 'react'
import { onToast } from '../utils/toast'

interface Toast {
  id: number
  message: string
  type: 'info' | 'error'
}

let toastId = 0

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return onToast((message, type) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2.5 rounded-lg shadow-lg text-white text-sm font-medium max-w-xs pointer-events-auto transition-all
            ${toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
