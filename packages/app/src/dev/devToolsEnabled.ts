export const devToolsEnabled =
  !import.meta.env.PROD || import.meta.env.VITE_ENABLE_TIME_TRAVEL === "true";
