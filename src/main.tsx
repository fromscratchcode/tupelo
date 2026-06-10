import { createRoot } from "react-dom/client";
import StandaloneApp from "./StandaloneApp";
import "./standalone.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found.");
}

createRoot(root).render(<StandaloneApp />);
