import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initDarkMode } from './utils/darkMode'
import { useDeviceStore } from './store/deviceStore'

initDarkMode()

// Fetch initial device state before render
async function bootstrap() {
  try {
    const [devRes, varRes] = await Promise.allSettled([
      fetch('/api/devices'),
      fetch('/api/hubvariables'),
    ])

    if (devRes.status === 'fulfilled' && devRes.value.ok) {
      const devices = await devRes.value.json()
      useDeviceStore.getState().setAllDevices(devices)
    }

    if (varRes.status === 'fulfilled' && varRes.value.ok) {
      const raw = await varRes.value.json()
      // Hub variables may come as [{name,value,type}] or {variables:[...]}
      const vars: unknown[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>)?.variables)
          ? (raw as Record<string, unknown[]>).variables
          : []
      if (vars.length > 0) {
        const record: Record<string, string | number> = {}
        for (const v of vars as Record<string, unknown>[]) {
          if (v.name && v.value !== undefined && v.value !== null)
            record[v.name as string] = v.value as string | number
        }
        if (Object.keys(record).length > 0)
          useDeviceStore.getState().setHubVariables(record)
      }
    }
  } catch {
    // Hub unreachable on load — SSE hook will handle reconnect
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

bootstrap()
