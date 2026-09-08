"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="narrow">
      <div className="empty" style={{ padding: "80px 16px" }}>
        <h1 style={{ fontSize: 22 }}>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button className="btn" onClick={reset} style={{ marginTop: 12 }}>
          Try again
        </button>
      </div>
    </div>
  );
}
