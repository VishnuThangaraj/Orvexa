import { type ReactNode } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/app/queryClient";
import { ThemeProvider } from "@/common/theme";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="orvexa-theme">
        <Router>{children}</Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
