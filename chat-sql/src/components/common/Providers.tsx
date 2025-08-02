"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SnackbarProvider } from "@/contexts/SnackbarContext";
import { GlobalSnackbar } from "@/components/common/Snackbar";
import { LLMProvider } from "@/contexts/LLMContext";
import { QueryProvider } from "@/contexts/QueryContext";
import { CompletionProvider } from "@/contexts/CompletionContext";
import { EditorProvider } from "@/contexts/EditorContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatSettingsProvider } from "@/contexts/ChatSettingsContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import NavBar from "@/components/NavBar/NavBar";
import Loading from "@/app/loading";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ERDiagramProvider } from "@/contexts/ERDiagramContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AppRouterCacheProvider>
      <SnackbarProvider>
        <ThemeProvider>
          <MuiThemeProvider theme={theme}>
            <ERDiagramProvider>
              <SelectionProvider>
                <ChatSettingsProvider>
                  <ChatProvider>
                    <LLMProvider>
                      <QueryProvider>
                        <EditorProvider>
                          <CompletionProvider>
                            <NavBar />
                            <GlobalSnackbar />
                            {isLoading ? <Loading /> : children}
                          </CompletionProvider>
                        </EditorProvider>
                      </QueryProvider>
                    </LLMProvider>
                  </ChatProvider>
                </ChatSettingsProvider>
              </SelectionProvider>
            </ERDiagramProvider>
          </MuiThemeProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </AppRouterCacheProvider>
  );
}
