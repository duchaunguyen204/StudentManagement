export default function StatCard({ icon, color, title, value, caption }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <p>{title}</p>
      <h3>{value}</h3>
      <span className="stat-caption">{caption}</span>
    </article>
  );
}