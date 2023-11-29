import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { FuncResultProvider } from "./components/funcResultProvider";
import { LocalStorageProvider } from "./components/lsProvider";
import { LogStoreProvider } from "./components/logStoreProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FuncResultProvider>
      <LocalStorageProvider>
        <LogStoreProvider>
          <App />
        </LogStoreProvider>
      </LocalStorageProvider>
    </FuncResultProvider>
  </React.StrictMode>
);
