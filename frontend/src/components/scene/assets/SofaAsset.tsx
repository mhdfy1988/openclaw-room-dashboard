import './sofa.css'

export function SofaAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="sofa-shell">
        <div className="sofa-tv">
          <span className="sofa-tv-screen" />
          <span className="sofa-tv-glow" />
          <span className="sofa-tv-stand" />
        </div>
        <div className="sofa-wall-strip" />
        <div className="sofa-body">
          <span className="sofa-backrest" />
          <span className="sofa-seat sofa-seat-left" />
          <span className="sofa-seat sofa-seat-center" />
          <span className="sofa-seat sofa-seat-right" />
          <span className="sofa-arm sofa-arm-left" />
          <span className="sofa-arm sofa-arm-right" />
          <span className="sofa-pillow sofa-pillow-left" />
          <span className="sofa-pillow sofa-pillow-right" />
        </div>
        <div className="sofa-rug" />
        <div className="sofa-side-table">
          <span className="sofa-side-mug" />
        </div>
      </div>
    </div>
  )
}
