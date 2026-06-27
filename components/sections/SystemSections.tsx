"use client"

import { SectionCard, ToggleRow } from "@/components/controls"
import { NOTIF_TYPES, WEEK_DAYS, type UiPrefs } from "@/lib/prefs"
import { BellIcon, GearIcon } from "@/components/icons"

type SetPrefs = (p: UiPrefs) => void

export function ScheduleCard({ prefs, setPrefs }: { prefs: UiPrefs; setPrefs: SetPrefs }) {
  const toggleDay = (i: number) => {
    const days = prefs.days.slice()
    days[i] = !days[i]
    setPrefs({ ...prefs, days })
  }

  return (
    <SectionCard icon={<GearIcon size={16} />} title="Horário de operação" sub="Janela autorizada de execução">
      <div className="time-rows">
        <div className="time-row">
          <span className="muted sm">das</span>
          <input
            className="input time-input num"
            type="time"
            value={prefs.windowStart}
            onChange={(e) => setPrefs({ ...prefs, windowStart: e.target.value })}
          />
          <span className="muted sm">às</span>
          <input
            className="input time-input num"
            type="time"
            value={prefs.windowEnd}
            onChange={(e) => setPrefs({ ...prefs, windowEnd: e.target.value })}
          />
        </div>
      </div>

      <ToggleRow
        name="Não operar fora dos horários"
        desc="Quando ligado, o robô só opera na janela e dias marcados"
        on={prefs.scheduleEnabled}
        onChange={(v) => setPrefs({ ...prefs, scheduleEnabled: v })}
      />

      <div className="days-label label" style={{ marginTop: 12 }}>
        Dias da semana
      </div>
      <div className="days">
        {WEEK_DAYS.map((d, i) => (
          <button key={d} type="button" className="day" data-on={prefs.days[i]} onClick={() => toggleDay(i)}>
            {d}
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

export function NotifPrefsCard({ prefs, setPrefs }: { prefs: UiPrefs; setPrefs: SetPrefs }) {
  return (
    <SectionCard icon={<BellIcon size={16} />} title="Notificações" sub="Alertas em tempo real">
      <div className="toggle-list">
        {NOTIF_TYPES.map((n) => (
          <ToggleRow
            key={n.key}
            name={n.name}
            on={prefs.notif[n.key] ?? false}
            onChange={(v) => setPrefs({ ...prefs, notif: { ...prefs.notif, [n.key]: v } })}
          />
        ))}
      </div>
    </SectionCard>
  )
}
