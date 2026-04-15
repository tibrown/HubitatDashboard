import { useState, useEffect, useCallback } from 'react'
import { Check, Delete } from 'lucide-react'

interface PinModalProps {
  isOpen: boolean
  title: string
  onConfirm: (pin: string) => void
  onCancel: () => void
}

export function PinModal({ isOpen, title, onConfirm, onCancel }: PinModalProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [shake, setShake] = useState(false)

  // Reset digits when modal closes
  useEffect(() => {
    if (!isOpen) setDigits([])
  }, [isOpen])

  const addDigit = useCallback((d: string) => {
    setDigits((prev) => {
      if (prev.length >= 4) return prev
      const next = [...prev, d]
      if (next.length === 4) {
        // Auto-submit on 4th digit
        setTimeout(() => onConfirm(next.join('')), 50)
      }
      return next
    })
  }, [onConfirm])

  const removeDigit = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1))
  }, [])

  const handleConfirm = useCallback(() => {
    if (digits.length === 4) onConfirm(digits.join(''))
  }, [digits, onConfirm])

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Backspace') removeDigit()
      else if (/^[0-9]$/.test(e.key)) addDigit(e.key)
      else if (e.key === 'Enter' && digits.length === 4) handleConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, digits, onCancel, addDigit, removeDigit, handleConfirm])

  if (!isOpen) return null

  const keys = ['1','2','3','4','5','6','7','8','9','backspace','0','confirm']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-72 flex flex-col items-center gap-5 ${shake ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 text-center">{title}</h2>

        {/* Dot indicators */}
        <div className="flex gap-3">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-colors ${
                i < digits.length
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-400 dark:border-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {keys.map((k) => {
            if (k === 'backspace') {
              return (
                <button
                  key={k}
                  onClick={removeDigit}
                  className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                  aria-label="Backspace"
                >
                  <Delete size={18} />
                </button>
              )
            }
            if (k === 'confirm') {
              return (
                <button
                  key={k}
                  onClick={handleConfirm}
                  disabled={digits.length < 4}
                  className="h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Confirm"
                >
                  <Check size={18} />
                </button>
              )
            }
            return (
              <button
                key={k}
                onClick={() => addDigit(k)}
                className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
              >
                {k}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
