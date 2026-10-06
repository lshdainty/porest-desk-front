// SnackbarView(카탈로그용 띠)는 내보내지 않는다 — 화면은 useSnackbar().show 로 띄운다
export { SnackbarAvoidOverlap, SnackbarProvider } from "./snackbar";
export {
  useSnackbar,
  type SnackbarAction,
  type SnackbarApi,
  type SnackbarOptions,
  type SnackbarTone,
} from "./snackbar-context";
