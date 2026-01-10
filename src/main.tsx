import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validación defensiva del elemento root
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "No se encontró el elemento root. Asegúrate de que existe un elemento con id='root' en index.html"
  );
}

// Renderizar la aplicación
const root = createRoot(rootElement);
root.render(<App />);
