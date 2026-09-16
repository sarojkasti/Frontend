import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "react-intl";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { SessionProvider } from "./context/SessionContext.tsx";

// Suppress known upstream Recharts 2.x defaultProps warning in React 18.3+
const filterDefaultProps = (originalFn: (...args: any[]) => void) => (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("defaultProps will be removed") || args[0].includes("Support for defaultProps"))
  ) {
    return;
  }
  originalFn(...args);
};
console.error = filterDefaultProps(console.error);
console.warn = filterDefaultProps(console.warn);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en" messages={{}}>
        <BrowserRouter>
          <SessionProvider>
            <App />
          </SessionProvider>
        </BrowserRouter>
      </IntlProvider>
    </QueryClientProvider>
  </StrictMode>
);
