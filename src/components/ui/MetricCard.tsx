
type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({
  label,
  value,
  detail,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
