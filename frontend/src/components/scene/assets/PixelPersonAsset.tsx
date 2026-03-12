import type { ReactElement } from 'react'
import './pixel-person.css'

type Facing = 'front' | 'back' | 'left' | 'right'

type PixelPersonAssetProps = {
  facing?: Facing
  accent?: 'navy' | 'teal' | 'amber'
}

type Palette = {
  hairLight: string
  hairMid: string
  hairDark: string
  skinLight: string
  skinDark: string
  coatLight: string
  coatDark: string
  accent: string
  shirt: string
  pantsLight: string
  pantsDark: string
  shoe: string
}

const SPRITE_WIDTH = 16

const LEFT_SPRITE = [
  '......ooo.......',
  '.....ohhho......',
  '....ohHHHho.....',
  '....ohHxxHho....',
  '....ohssssho....',
  '....ohsSeeho....',
  '.....ohsssso....',
  '.....oCwwwCo....',
  '....oCCwaCcCo...',
  '....oCccccccCo..',
  '...oCCcccccccCo.',
  '...oCccccccccCo.',
  '...oCccccccccCo.',
  '....oCccccccCo..',
  '....oCCcccCCo...',
  '.....oCPppPo....',
  '.....oPPppPo....',
  '.....oPPppbbo...',
  '......ob..bb....',
  '......ob..bo....',
  '.....obb..bbo...',
  '.....bb....bb...',
  '....bb......bb..',
  '................',
] as const

function mirrorRows(rows: readonly string[]) {
  return rows.map((row) => row.split('').reverse().join(''))
}

const SPRITES: Record<Facing, string[]> = {
  front: [
    '......oooo......',
    '.....ohhhho.....',
    '....ohHHHHho....',
    '....ohHxxHHho...',
    '....ohssssSho...',
    '....ohsSeesho...',
    '....ohsssssho...',
    '....oowwwwoo....',
    '....oCwwaawwCo..',
    '...oCCwccccwCCo.',
    '..oCccccccccCo..',
    '..oCccccccccCo..',
    '..oCcccaaacccCo.',
    '..oCccccccccCo..',
    '...oCccccccCo...',
    '...oCcppppCo....',
    '...oCPppppPCo...',
    '...oPPppppPPo...',
    '....oPp..pPo....',
    '...obbb..bbbo...',
    '...ob......bo...',
    '..obb......bbo..',
    '..bb........bb..',
    '................',
  ],
  back: [
    '......oooo......',
    '.....ohhhho.....',
    '....ohHHHHho....',
    '....ohHxxHHho...',
    '....ohhhhhhho...',
    '....ohHhhhHho...',
    '....ooCCCCoo....',
    '...oCCccccCCo...',
    '..oCccccccccCo..',
    '..oCccccccccccCo',
    '..oCccccaaacccCo',
    '..oCccccccccccCo',
    '..oCccccccccccCo',
    '..oCccccccccCo..',
    '...oCccccccCo...',
    '...oCCppppCCo...',
    '...oPPppppPPo...',
    '...oPPppppPPo...',
    '....oPp..pPo....',
    '...obbb..bbbo...',
    '...ob......bo...',
    '..obb......bbo..',
    '..bb........bb..',
    '................',
  ],
  left: [...LEFT_SPRITE],
  right: mirrorRows(LEFT_SPRITE),
}

const ACCENTS: Record<'navy' | 'teal' | 'amber', Palette> = {
  navy: {
    hairLight: '#87624d',
    hairMid: '#65473a',
    hairDark: '#352521',
    skinLight: '#f0cfaa',
    skinDark: '#b88460',
    coatLight: '#5e75ab',
    coatDark: '#334468',
    accent: '#d4b276',
    shirt: '#efe8da',
    pantsLight: '#566178',
    pantsDark: '#30384b',
    shoe: '#1a2230',
  },
  teal: {
    hairLight: '#8c684d',
    hairMid: '#684834',
    hairDark: '#38271c',
    skinLight: '#efccaa',
    skinDark: '#b57e57',
    coatLight: '#4f8a89',
    coatDark: '#285557',
    accent: '#d2d8a0',
    shirt: '#edf0df',
    pantsLight: '#56636c',
    pantsDark: '#313a43',
    shoe: '#1c242c',
  },
  amber: {
    hairLight: '#ab7747',
    hairMid: '#87582f',
    hairDark: '#4e3018',
    skinLight: '#f1cfab',
    skinDark: '#bb825a',
    coatLight: '#a27a57',
    coatDark: '#65462c',
    accent: '#ead8b7',
    shirt: '#f3ead9',
    pantsLight: '#6d655d',
    pantsDark: '#39332f',
    shoe: '#221d1b',
  },
}

function getColorMap(palette: Palette) {
  return {
    o: '#1c1d28',
    h: palette.hairDark,
    H: palette.hairMid,
    x: palette.hairLight,
    s: palette.skinLight,
    S: palette.skinDark,
    e: '#3f2d25',
    c: palette.coatLight,
    C: palette.coatDark,
    w: palette.shirt,
    a: palette.accent,
    p: palette.pantsLight,
    P: palette.pantsDark,
    b: palette.shoe,
  } as const
}

function renderSprite(rows: string[], palette: Palette) {
  const colorMap = getColorMap(palette)
  const pixels: ReactElement[] = []

  rows.forEach((rawRow, y) => {
    const row = rawRow.padEnd(SPRITE_WIDTH, '.')

    for (let x = 0; x < row.length; x += 1) {
      const token = row[x] as keyof typeof colorMap | '.'
      const fill = token === '.' ? null : colorMap[token]

      if (!fill) continue

      pixels.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />)
    }
  })

  return pixels
}

export function PixelPersonAsset({ facing = 'back', accent = 'navy' }: PixelPersonAssetProps) {
  const palette = ACCENTS[accent]
  const sprite = SPRITES[facing]

  return (
    <div className="pixel-person-layer" aria-hidden="true">
      <div className="pixel-person-shell">
        <svg
          className="pixel-person-shadow"
          viewBox="0 0 12 3"
          shapeRendering="crispEdges"
          preserveAspectRatio="none"
        >
          <rect x="1" y="1" width="10" height="1" fill="rgba(11,16,26,0.22)" />
          <rect x="3" y="0" width="6" height="1" fill="rgba(11,16,26,0.12)" />
        </svg>

        <svg
          className={`pixel-person-sprite pixel-person-sprite-${facing}`}
          viewBox={`0 0 ${SPRITE_WIDTH} ${sprite.length}`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMax meet"
        >
          {renderSprite(sprite, palette)}
        </svg>
      </div>
    </div>
  )
}
