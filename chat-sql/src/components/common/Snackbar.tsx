import { Alert, Snackbar as MuiSnackbar } from "@mui/material";
import { useSnackbar } from "@/contexts/SnackbarContext";

export const GlobalSnackbar = () => {
  const { snackbar, hideSnackbar } = useSnackbar();

  return (
    <MuiSnackbar
      open={snackbar.open}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={hideSnackbar}
      sx={{ mt: 4 }}
    >
      <Alert
        onClose={hideSnackbar}
        severity={snackbar.severity}
        sx={{
          width: "100%",
          bgcolor: `var(--${snackbar.severity}-bg)`,
          color: "var(--snackbar-text)",
          "& .MuiAlert-icon": {
            color: `var(--${snackbar.severity}-icon)`,
          },
        }}
      >
        {snackbar.message}
      </Alert>
    </MuiSnackbar>
  );
};
