import { useEffect, useRef } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { showToast } from '../utils/toast'
import type { SSEEvent } from '../types'

export function useSSE(): void {
  const applyEvent = useDeviceStore((s) => s.applyEvent)
  const setAllDevices = useDeviceStore((s) => s.setAllDevices)
  const setConnectionStatus = useDeviceStore((s) => s.setConnectionStatus)

  const esRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasConnected = useRef(false)

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling() {
    stopPolling()
    setConnectionStatus('polling')
    showToast('Connection lost — polling for updates', 'info')
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/devices')
        if (res.ok) {
          const devices = await res.json()
          setAllDevices(devices)
        }
      } catch {
        // network error during polling — keep trying
      }
    }, 30_000)
  }

  function connect() {
    if (esRef.current) {
      esRef.current.close()
    }
    setConnectionStatus('reconnecting')
    const es = new EventSource('/api/events')
    esRef.current = es

    es.onopen = () => {
      stopPolling()
      if (wasConnected.current) {
        showToast('Connected', 'info')
      }
      wasConnected.current = true
      setConnectionStatus('connected')
    }

    es.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent
        applyEvent(event)
      } catch {
        // malformed event — skip
      }
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      startPolling()
    }
  }

  useEffect(() => {
    connect()

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      esRef.current?.close()
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])
}
