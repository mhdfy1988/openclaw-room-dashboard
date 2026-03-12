import type { CSSProperties } from 'react'
import type { Agent } from '../types/room'

type AgentAvatarThemeStyle = CSSProperties & {
  '--avatar-shell': string
  '--avatar-ring-fill': string
  '--avatar-ring-glow': string
  '--avatar-highlight': string
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function toHue(seed: number, offset = 0) {
  return (seed + offset) % 360
}

function hsla(hue: number, saturation: number, lightness: number, alpha: number) {
  return `hsla(${Math.round(hue)}, ${saturation}%, ${lightness}%, ${alpha})`
}

export function getAgentAvatarTheme(agent: Pick<Agent, 'id' | 'name' | 'role'>): AgentAvatarThemeStyle {
  const seed = hashString(`${agent.id}:${agent.name}:${agent.role}`)
  const baseHue = toHue(seed % 360)
  const accentHue = toHue(baseHue, 18 + (seed % 27))
  const shadowHue = toHue(baseHue, 210)

  return {
    '--avatar-shell': `linear-gradient(180deg, ${hsla(baseHue, 42, 48, 0.96)} 0%, ${hsla(
      toHue(baseHue, 16),
      34,
      24,
      0.97,
    )} 100%)`,
    '--avatar-ring-fill': `radial-gradient(circle at 30% 28%, ${hsla(
      accentHue,
      58,
      76,
      0.18,
    )}, ${hsla(accentHue, 58, 76, 0)} 42%), linear-gradient(180deg, ${hsla(
      toHue(baseHue, 8),
      32,
      22,
      0.97,
    )} 0%, ${hsla(shadowHue, 26, 11, 0.98)} 100%)`,
    '--avatar-ring-glow': hsla(accentHue, 48, 62, 0.2),
    '--avatar-highlight': hsla(accentHue, 52, 78, 0.72),
  }
}
