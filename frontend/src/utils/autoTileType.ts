import type { DeviceState, TileType } from '../types'

/**
 * Infer a tile type from what a device reports (attributes + commands).
 * Used by the "Other" group to auto-render unclaimed devices.
 */
export function autoTileType(device: DeviceState): TileType {
  const attrs = device.attributes
  const cmds = device.commands ?? []

  // Color bulb/strip — has hue attribute or setColor command
  if ('hue' in attrs || cmds.includes('setColor')) return 'rgbw'

  // Dimmable — has level + setLevel + switch
  if ('level' in attrs && cmds.includes('setLevel') && 'switch' in attrs) return 'dimmer'

  // Lock
  if ('lock' in attrs) return 'lock'

  // Contact sensor
  if ('contact' in attrs) return 'contact'

  // Motion sensor
  if ('motion' in attrs) return 'motion'

  // Presence
  if ('presence' in attrs) return 'presence'

  // Power meter only (no switch)
  if ('power' in attrs && !('switch' in attrs)) return 'power-meter'

  // Temperature only sensor (no switch)
  if ('temperature' in attrs && !('switch' in attrs)) return 'temperature'

  // Pushable button
  if (cmds.includes('push')) return 'button'

  // Default — treat as a plain switch
  return 'switch'
}
