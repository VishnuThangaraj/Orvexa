import { type ReactNode } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/app/queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>{children}</Router>
    </QueryClientProvider>
  );
};

export default AppProviders;
