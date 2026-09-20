export default function Loading() {
  return (
    <div className="wrap">
      <div className="section">
        <div className="sk-line sk-w40" />
        <div className="sk-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sk-card">
              <div className="sk-cover" />
              <div className="sk-line" />
              <div className="sk-line sk-w60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
