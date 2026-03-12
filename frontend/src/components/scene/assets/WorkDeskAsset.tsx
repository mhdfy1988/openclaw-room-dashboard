import './work-desk.css'

export function WorkDeskAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="workdesk-shell">
        <div className="workdesk-monitor">
          <span className="workdesk-monitor-glow" />
          <span className="workdesk-monitor-text workdesk-monitor-text-primary" />
          <span className="workdesk-monitor-text workdesk-monitor-text-secondary" />
        </div>
        <div className="workdesk-toolbar">
          <span className="workdesk-pill workdesk-pill-live">SYNC</span>
          <span className="workdesk-pill">TASKS</span>
        </div>
        <div className="workdesk-lamp" />
        <div className="workdesk-mug" />
        <div className="workdesk-base" />
      </div>
    </div>
  )
}
