import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
      <h1>React TypeScript Playground</h1>
      <p>Edit main.tsx and save to update this WebContainer app.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
