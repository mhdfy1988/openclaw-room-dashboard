import './bed.css'

export function BedAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="bed-shell">
        <div className="bed-headboard" />
        <div className="bed-mattress">
          <span className="bed-pillow bed-pillow-left" />
          <span className="bed-pillow bed-pillow-right" />
          <span className="bed-blanket" />
          <span className="bed-throw" />
        </div>
        <div className="bed-frame" />
        <div className="bed-nightstand">
          <span className="bed-lamp" />
        </div>
        <div className="bed-rug" />
      </div>
    </div>
  )
}
