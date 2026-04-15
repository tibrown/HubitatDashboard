import { useState, useEffect } from 'react'
import { groups } from '../config/groups'
import type { TileConfig } from '../types'
import { SwitchTile } from './tiles/SwitchTile'
import { DimmerTile } from './tiles/DimmerTile'
import { RGBWTile } from './tiles/RGBWTile'
import { ContactTile } from './tiles/ContactTile'
import { MotionTile } from './tiles/MotionTile'
import { TemperatureTile } from './tiles/TemperatureTile'
import { PowerMeterTile } from './tiles/PowerMeterTile'
import { ButtonTile } from './tiles/ButtonTile'
import { LockTile } from './tiles/LockTile'
import { ConnectorSwitchTile } from './tiles/ConnectorSwitchTile'
import { HubVariableTile } from './tiles/HubVariableTile'
import { HSMTile } from './tiles/HSMTile'
import { ModeTile } from './tiles/ModeTile'
import { RingDetectionTile } from './tiles/RingDetectionTile'
import { PresenceTile } from './tiles/PresenceTile'

interface Props {
  groupId: string
}

function useGridColumns() {
  const getColumns = () => {
    const w = window.innerWidth
    if (w >= 1280) return 5 // xl
    if (w >= 1024) return 4 // lg
    if (w >= 640) return 3  // sm
    return 2
  }
  const [cols, setCols] = useState(getColumns)
  useEffect(() => {
    const handler = () => setCols(getColumns())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return cols
}

const PINNED_TYPES = new Set(['hsm', 'mode'])

function sortColumnMajor(tiles: TileConfig[], numCols: number): (TileConfig | null)[] {
  const sorted = [...tiles].sort((a, b) => a.label.localeCompare(b.label))
  const N = sorted.length
  if (N === 0) return []
  const numRows = Math.ceil(N / numCols)
  const result: (TileConfig | null)[] = new Array(numRows * numCols).fill(null)
  for (let i = 0; i < N; i++) {
    const col = Math.floor(i / numRows)
    const row = i % numRows
    result[row * numCols + col] = sorted[i]
  }
  return result
}

function renderTile(tile: TileConfig) {
  const id = tile.deviceId ?? tile.tileType
  const base = { deviceId: tile.deviceId ?? '', label: tile.label }
  switch (tile.tileType) {
    case 'switch': return <SwitchTile key={id} {...base} />
    case 'dimmer': return <DimmerTile key={id} {...base} />
    case 'rgbw': return <RGBWTile key={id} {...base} />
    case 'contact': return <ContactTile key={id} {...base} />
    case 'motion': return <MotionTile key={id} {...base} />
    case 'temperature': return <TemperatureTile key={id} {...base} />
    case 'power-meter': return <PowerMeterTile key={id} {...base} />
    case 'button': return <ButtonTile key={id} {...base} />
    case 'lock': return <LockTile key={id} {...base} />
    case 'connector': return <ConnectorSwitchTile key={id} {...base} />
    case 'hub-variable': return <HubVariableTile key={id} hubVarName={tile.hubVarName ?? ''} label={tile.label} />
    case 'hsm': return <HSMTile key="hsm" />
    case 'mode': return <ModeTile key="mode" />
    case 'ring-detection': return <RingDetectionTile key={id} deviceId={tile.deviceId ?? ''} label={tile.label} lrpHubVarName={tile.hubVarName ?? ''} />
    case 'presence': return <PresenceTile key={id} {...base} />
    default: return null
  }
}

export function GroupPage({ groupId }: Props) {
  const group = groups.find((g) => g.id === groupId)
  const numCols = useGridColumns()

  if (!group) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Group not found: <span className="font-mono">{groupId}</span></p>
        <p className="text-sm mt-1">This group will be available once devices are configured.</p>
      </div>
    )
  }

  const pinnedTiles = group.tiles.filter((t) => PINNED_TYPES.has(t.tileType))
  const restTiles = group.tiles.filter((t) => !PINNED_TYPES.has(t.tileType))
  const tilesOrNull = sortColumnMajor(restTiles, numCols)

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{group.displayName}</h1>
      {pinnedTiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-3">
          {pinnedTiles.map((tile) => renderTile(tile))}
        </div>
      )}
      {tilesOrNull.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tilesOrNull.map((tile, i) =>
            tile ? renderTile(tile) : <div key={`empty-${i}`} aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  )
}
