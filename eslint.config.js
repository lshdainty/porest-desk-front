import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { fsdConfig } from "./eslint.fsd.js";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // `_` 로 시작하는 인자는 "안 쓰지만 자리는 필요하다" 는 뜻이다 —
      // 콜백 시그니처를 맞추거나(handleDragEnd(_event)), 하위 호환으로 인자를
      // 받아만 두는(setToken(_token)) 자리다. 지울 수 없는 인자라 규칙에 알려 준다.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // 계층 규칙은 eslint.fsd.js 하나가 정의한다 (CI 게이트와 같은 정의).
  ...fsdConfig,
]);
