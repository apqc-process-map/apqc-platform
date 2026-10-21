export default function Loading() {
  return <main className="apqc-loading-shell" aria-live="polite" aria-busy="true" aria-label="Đang tải dữ liệu">
    <aside className="apqc-loading-sidebar" aria-hidden="true">
      <div className="apqc-loading-skeleton skeleton-brand"/>
      {Array.from({length:9},(_,i)=><div className="apqc-loading-skeleton skeleton-menu" key={i}/>)}
    </aside>
    <section className="apqc-loading-main">
      <div className="apqc-loading-skeleton skeleton-title"/>
      <div className="apqc-loading-skeleton skeleton-subtitle"/>
      <div className="apqc-loading-cards" aria-hidden="true">
        {Array.from({length:3},(_,i)=><div className="apqc-loading-skeleton skeleton-card" key={i}/>)}
      </div>
      <div className="apqc-loading-skeleton skeleton-list" aria-hidden="true"/>
      <div className="apqc-loading-skeleton skeleton-list" aria-hidden="true"/>
      <span className="apqc-loading-label">Đang tải dữ liệu…</span>
    </section>
  </main>;
}
