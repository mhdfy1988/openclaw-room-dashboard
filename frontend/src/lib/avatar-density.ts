import type { ZoneMeta } from '../types/room'

export function getAvatarDensity(zoneKey: ZoneMeta['key'], count: number) {
  if (zoneKey === 'center-console') {
    if (count >= 7) {
      return 'packed'
    }
    if (count >= 5) {
      return 'dense'
    }
    if (count >= 3) {
      return 'crowded'
    }
    return 'normal'
  }

  if (zoneKey === 'work-desk' || zoneKey === 'study-desk') {
    if (count >= 4) {
      return 'packed'
    }
    if (count >= 3) {
      return 'dense'
    }
    if (count >= 2) {
      return 'crowded'
    }
    return 'normal'
  }

  if (count >= 5) {
    return 'packed'
  }
  if (count >= 4) {
    return 'dense'
  }
  if (count >= 3) {
    return 'crowded'
  }

  return 'normal'
}
