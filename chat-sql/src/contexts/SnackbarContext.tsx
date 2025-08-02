import { createContext, useContext, useState } from "react";

type Severity = "success" | "info" | "warning" | "error";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface SnackbarContextType {
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity: Severity) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType>({
  snackbar: { open: false, message: "", severity: "info" },
  showSnackbar: () => {},
  hideSnackbar: () => {},
});

export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (message: string, severity: Severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
