import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { FuncResultProvider } from "./components/funcResult";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FuncResultProvider>
      <App />
    </FuncResultProvider>
  </React.StrictMode>
);
