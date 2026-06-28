/** Esqueletos de carregamento exibidos enquanto o estado do robô carrega. */
export function CentralSkeleton() {
  return (
    <div className="tab-stack">
      <section className="grid metrics-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card metric">
            <div className="sk sk-line" style={{ width: "55%" }} />
            <div className="sk sk-line lg" style={{ width: "70%", marginTop: 16 }} />
          </div>
        ))}
      </section>
      <section className="grid two-grid">
        <div className="card pad">
          <div className="sk sk-line" style={{ width: "40%" }} />
          <div className="sk sk-block" style={{ height: 90, marginTop: 16 }} />
        </div>
        <div className="card pad">
          <div className="sk sk-line" style={{ width: "40%" }} />
          <div className="sk sk-block" style={{ height: 90, marginTop: 16 }} />
        </div>
      </section>
      <section className="grid power-grid">
        <div className="card pad">
          <div className="sk sk-block" style={{ height: 200 }} />
        </div>
        <div className="card pad">
          <div className="sk sk-block" style={{ height: 200 }} />
        </div>
        <div className="card pad">
          <div className="sk sk-block" style={{ height: 200 }} />
        </div>
      </section>
    </div>
  )
}
