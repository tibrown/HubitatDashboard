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
      const vars = await varRes.value.json()
      // Hub variables come as [{name, value, type}] — convert to Record
      if (Array.isArray(vars)) {
        const record: Record<string, string | number> = {}
        for (const v of vars) {
          record[v.name] = v.value
        }
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
