// src/main.jsx
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx"; // Updated extension
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Failed to find the root element.");
}