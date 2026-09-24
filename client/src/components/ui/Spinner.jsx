export default function Spinner({ size = 20, color = "var(--color-brand)" }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}25`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
