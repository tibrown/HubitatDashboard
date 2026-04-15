import type { DeviceState } from './types.js';

const cache = new Map<string, DeviceState>();

export function getDevice(id: string): DeviceState | undefined {
  return cache.get(id);
}

export function setDevice(id: string, state: DeviceState): void {
  cache.set(id, state);
}

export function updateDeviceAttribute(id: string, attribute: string, value: unknown): void {
  const device = cache.get(id);
  if (!device) return;
  cache.set(id, {
    ...device,
    attributes: {
      ...device.attributes,
      [attribute]: value as string | number | boolean | null,
    },
  });
}

export function getAllDevices(): DeviceState[] {
  return Array.from(cache.values());
}

export function setAllDevices(devices: DeviceState[]): void {
  cache.clear();
  for (const d of devices) {
    cache.set(d.id, d);
  }
}
