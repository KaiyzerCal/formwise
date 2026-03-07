import React from "react";

// ── Integration layer bootstrap (registers all event subscribers)
// Import side-effects only — does not change any UI
import "./components/integration/index.js";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {children}
    </div>
  );
}