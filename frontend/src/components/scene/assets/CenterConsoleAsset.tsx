import './center-console.css'

export function CenterConsoleAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="console-shell">
        <div className="console-desk-shadow" />
        <div className="console-monitor-rig">
          <span className="console-monitor console-monitor-left" />
          <span className="console-monitor console-monitor-center" />
          <span className="console-monitor console-monitor-right" />
        </div>
        <div className="console-support console-support-left" />
        <div className="console-support console-support-right" />
        <div className="console-chair">
          <span className="console-chair-back" />
          <span className="console-chair-seat" />
        </div>
        <div className="console-desk-surface">
          <span className="console-desk-trim" />
          <span className="console-control-strip" />
          <span className="console-module console-module-left" />
          <span className="console-module console-module-right" />
          <span className="console-keyboard" />
        </div>
        <div className="console-desk-front">
          <span className="console-front-panel console-front-panel-left" />
          <span className="console-front-panel console-front-panel-center" />
          <span className="console-front-panel console-front-panel-right" />
        </div>
        <div className="console-sidecar console-sidecar-left" />
        <div className="console-sidecar console-sidecar-right" />
      </div>
    </div>
  )
}
