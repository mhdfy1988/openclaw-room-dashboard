import './study-room.css'

export function StudyRoomAsset() {
  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="studyroom-shell">
        <div className="studyroom-bookcase">
          <span className="studyroom-shelf studyroom-shelf-top" />
          <span className="studyroom-shelf studyroom-shelf-mid" />
          <span className="studyroom-shelf studyroom-shelf-bottom" />
        </div>
        <div className="studyroom-pinboard">
          <span className="studyroom-note studyroom-note-left" />
          <span className="studyroom-note studyroom-note-right" />
          <span className="studyroom-pin studyroom-pin-a" />
          <span className="studyroom-pin studyroom-pin-b" />
        </div>
        <div className="studyroom-lamp">
          <span className="studyroom-light" />
        </div>
        <div className="studyroom-desk-surface">
          <span className="studyroom-open-book" />
          <span className="studyroom-notebook" />
          <span className="studyroom-book-stack" />
          <span className="studyroom-pen-cup" />
        </div>
        <div className="studyroom-desk-front">
          <span className="studyroom-drawer studyroom-drawer-left" />
          <span className="studyroom-drawer studyroom-drawer-right" />
        </div>
        <div className="studyroom-chair" />
      </div>
    </div>
  )
}
