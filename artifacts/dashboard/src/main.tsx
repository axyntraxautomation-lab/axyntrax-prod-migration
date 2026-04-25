import { useEffect } from "react";

// Patching fetch globally to include credentials
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  
  if (config) {
    config.credentials = 'include';
  } else {
    args[1] = { credentials: 'include' };
  }
  
  return originalFetch(...args);
};

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);