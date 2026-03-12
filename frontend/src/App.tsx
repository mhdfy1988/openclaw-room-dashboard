import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { AgentDetailPanel } from './components/panels/AgentDetailPanel'
import { AlertListPanel } from './components/panels/AlertListPanel'
import { EventListPanel } from './components/panels/EventListPanel'
import { GatewayConnectionsPanel } from './components/panels/GatewayConnectionsPanel'
import { RoomSummaryPanel } from './components/panels/RoomSummaryPanel'
import { RoomScene } from './components/scene/RoomScene'
import { OpenClawSettingsDialog } from './components/settings/OpenClawSettingsDialog'
import { Topbar } from './components/topbar/Topbar'
import { zones } from './constants/zones'
import { useManagedAlerts } from './hooks/useManagedAlerts'
import { useRoomState } from './hooks/useRoomState'
import { buildDashboardOverview } from './lib/dashboard-selectors'
import { mergeRoomAlerts } from './lib/room-alerts'
import { useSelectedAgent } from './hooks/useSelectedAgent'
import { consumeOpenClawLinkDraftFromLocation } from './lib/openclaw-link'
import { buildRoomSummary } from './lib/room-summary'
import { groupAgentsByZone } from './lib/zone-grouping'
import type { OpenClawLinkDraft } from './types/openclaw'

function App() {
  const { data, streamState, refreshState } = useRoomState()
  const environmentLabel = import.meta.env.DEV ? 'DEV' : 'PROD'
  const initialLinkDraft = useState<OpenClawLinkDraft | null>(() => consumeOpenClawLinkDraftFromLocation())[0]
  const agents = useMemo(() => data?.agents ?? [], [data?.agents])
  const [settingsOpen, setSettingsOpen] = useState(() => initialLinkDraft != null)
  const [linkDraft, setLinkDraft] = useState<OpenClawLinkDraft | null>(initialLinkDraft)

  const { selectedAgent, selectAgent, clearSelection } = useSelectedAgent({ agents })
  const zoneMap = useMemo(() => groupAgentsByZone(agents), [agents])
  const roomSummary = useMemo(() => buildRoomSummary(agents, zoneMap, zones), [agents, zoneMap])
  const mergedAlerts = useMemo(
    () => mergeRoomAlerts(data?.alerts ?? [], streamState),
    [data?.alerts, streamState],
  )
  const { alerts, mutedAlertCount, acknowledgeAlert, muteAlert, restoreMutedAlerts } =
    useManagedAlerts(mergedAlerts)
  const overview = useMemo(() => buildDashboardOverview(data, alerts), [data, alerts])
  const isAgentFocused = selectedAgent != null

  const openSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  const consumeLinkDraft = useCallback(() => {
    setLinkDraft(null)
  }, [])

  const handleSaved = useCallback(() => {
    void refreshState()
  }, [refreshState])

  return (
    <main className="app-shell">
      <Topbar
        overview={overview}
        alerts={alerts}
        environmentLabel={environmentLabel}
        streamState={streamState}
        onOpenSettings={openSettings}
      />

      <section className={`layout ${isAgentFocused ? 'layout-focused' : ''}`}>
        <section className="room-panel">
          <RoomScene
            data={data}
            zones={zones}
            zoneMap={zoneMap}
            selectedAgent={selectedAgent}
            onSelectAgent={selectAgent}
          />
        </section>

        <aside className={`side-panel ${isAgentFocused ? 'side-panel-focused' : ''}`}>
          <div className={`panel-card detail-card ${isAgentFocused ? 'detail-card-focused' : ''}`}>
            {selectedAgent ? (
              <AgentDetailPanel
                agent={selectedAgent}
                onClearSelection={clearSelection}
                showClearSelection
              />
            ) : (
              <>
                <div className="panel-title-row detail-title-row">
                  <h2>房间概览</h2>
                </div>
                <RoomSummaryPanel data={data} roomSummary={roomSummary} />
              </>
            )}
          </div>

          {isAgentFocused ? null : (
            <>
              <AlertListPanel
                alerts={alerts}
                mutedAlertCount={mutedAlertCount}
                onAcknowledgeAlert={acknowledgeAlert}
                onMuteAlert={muteAlert}
                onRestoreMutedAlerts={restoreMutedAlerts}
              />
              <GatewayConnectionsPanel
                connections={data?.connections ?? []}
                gateway={data?.gateway ?? null}
              />
              <EventListPanel events={data?.events ?? []} />
            </>
          )}
        </aside>
      </section>

      <OpenClawSettingsDialog
        open={settingsOpen}
        linkDraft={linkDraft}
        onConsumeLinkDraft={consumeLinkDraft}
        onClose={closeSettings}
        onSaved={handleSaved}
      />
    </main>
  )
}

export default App
