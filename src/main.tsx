import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRoot } from "@/app";
import "./index.css";
import "./shared/styles/groo.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
