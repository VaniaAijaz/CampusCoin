export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-dark)", marginBottom: 4 }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 13, color: "var(--color-subtle)", maxWidth: 300, margin: "0 auto" }}>
            {description}
          </div>
        )}
      </div>
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
