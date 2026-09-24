export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && (
        <div className="breadcrumb" style={{ marginBottom: 8 }}>
          {breadcrumb}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-dark)", margin: 0, lineHeight: 1.3 }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 13, color: "var(--color-subtle)", margin: "4px 0 0" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
