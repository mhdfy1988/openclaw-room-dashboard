import './work-studio.css'

export function WorkStudioAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="workstudio-shell">
        <div className="workstudio-rack">
          <span className="workstudio-rack-led workstudio-rack-led-a" />
          <span className="workstudio-rack-led workstudio-rack-led-b" />
          <span className="workstudio-rack-led workstudio-rack-led-c" />
        </div>
        <div className="workstudio-monitor-rig">
          <span className="workstudio-screen workstudio-screen-left" />
          <span className="workstudio-screen workstudio-screen-main" />
          <span className="workstudio-screen workstudio-screen-right" />
        </div>
        <div className="workstudio-speaker workstudio-speaker-left" />
        <div className="workstudio-speaker workstudio-speaker-right" />
        <div className="workstudio-desk-surface">
          <span className="workstudio-pad" />
          <span className="workstudio-keyboard" />
          <span className="workstudio-tablet" />
          <span className="workstudio-mouse" />
        </div>
        <div className="workstudio-desk-front">
          <span className="workstudio-drawer workstudio-drawer-left" />
          <span className="workstudio-drawer workstudio-drawer-right" />
        </div>
        <div className="workstudio-tower">
          <span className="workstudio-tower-light" />
        </div>
        <div className="workstudio-stool" />
      </div>
    </div>
  )
}
