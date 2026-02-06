export const config = {
  appTitle: 'POREST Desk',
  apiBaseUrl: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`,
  ssoUrl: import.meta.env.VITE_SSO_URL || '',
} as const
