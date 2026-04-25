import { useEffect, useRef } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { showToast } from '../utils/toast'
import type { SSEEvent } from '../types'

const HUB_VAR_POLL_MS = 24 * 60 * 60 * 1000 // once-a-day fallback; push from hub is primary

async function fetchHubVariables(): Promise<Record<string, string | number> | null> {
  try {
    const res = await fetch('/api/hubvariables')
    if (!res.ok) return null
    const raw = await res.json()
    // Hubitat may return [{name,value,type}] or {variables:[...]}
    const vars: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.variables)
        ? (raw as Record<string, unknown[]>).variables
        : []
    if (vars.length === 0) return null
    const record: Record<string, string | number> = {}
    for (const v of vars) {
      const item = v as Record<string, unknown>
      if (item.name && item.value !== undefined && item.value !== null)
        record[item.name as string] = item.value as string | number
    }
    return Object.keys(record).length > 0 ? record : null
  } catch {
    return null
  }
}

export function useSSE(): void {
  const applyEvent = useDeviceStore((s) => s.applyEvent)
  const setAllDevices = useDeviceStore((s) => s.setAllDevices)
  const setHubVariables = useDeviceStore((s) => s.setHubVariables)
  const setCurrentMode = useDeviceStore((s) => s.setCurrentMode)
  const setConnectionStatus = useDeviceStore((s) => s.setConnectionStatus)

  const esRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hubVarPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasConnected = useRef(false)

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startHubVarPolling() {
    if (hubVarPollRef.current) return // already running
    // Fetch immediately, then repeat every 5 minutes
    fetchHubVariables().then((vars) => { if (vars) setHubVariables(vars) })
    hubVarPollRef.current = setInterval(async () => {
      const vars = await fetchHubVariables()
      if (vars) setHubVariables(vars)
    }, HUB_VAR_POLL_MS)
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
      // Always refresh hub variables and current mode on (re)connect
      fetchHubVariables().then((vars) => { if (vars) setHubVariables(vars) })
      fetch('/api/modes')
        .then((r) => r.ok ? r.json() : null)
        .then((modes: Array<{ id: string; name: string; active: boolean }> | null) => {
          if (!modes) return
          const active = modes.find((m) => m.active)
          if (active) setCurrentMode(active.name)
        })
        .catch(() => { /* ignore — webhook events will catch up */ })
      if (wasConnected.current) {
        // Reconnect after a drop — force-refresh all device state so hub mesh
        // devices that went offline during a hub reboot show their current state
        showToast('Connected', 'info')
        fetch('/api/devices')
          .then((r) => r.ok ? r.json() : null)
          .then((devices) => { if (devices) setAllDevices(devices) })
          .catch(() => { /* ignore — SSE updates will catch up */ })
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
    startHubVarPolling()

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      esRef.current?.close()
      stopPolling()
      if (hubVarPollRef.current) clearInterval(hubVarPollRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])
}
