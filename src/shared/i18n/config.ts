import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 각 언어별 네임스페이스 import
import koCommon from '@/locales/ko/common.json'
import koLayout from '@/locales/ko/layout.json'
import koTodo from '@/locales/ko/todo.json'
import koCalendar from '@/locales/ko/calendar.json'
import koMemo from '@/locales/ko/memo.json'
import koTimer from '@/locales/ko/timer.json'
import koExpense from '@/locales/ko/expense.json'
import koBudget from '@/locales/ko/budget.json'
import koCard from '@/locales/ko/card.json'
import koCategory from '@/locales/ko/category.json'
import koAsset from '@/locales/ko/asset.json'
import koDashboard from '@/locales/ko/dashboard.json'
import koDutchPay from '@/locales/ko/dutchPay.json'
import koNotification from '@/locales/ko/notification.json'
import koLogin from '@/locales/ko/login.json'
import koUser from '@/locales/ko/user.json'
import koExport from '@/locales/ko/export.json'
import koSettings from '@/locales/ko/settings.json'

import enCommon from '@/locales/en/common.json'
import enLayout from '@/locales/en/layout.json'
import enTodo from '@/locales/en/todo.json'
import enCalendar from '@/locales/en/calendar.json'
import enMemo from '@/locales/en/memo.json'
import enTimer from '@/locales/en/timer.json'
import enExpense from '@/locales/en/expense.json'
import enBudget from '@/locales/en/budget.json'
import enCard from '@/locales/en/card.json'
import enCategory from '@/locales/en/category.json'
import enAsset from '@/locales/en/asset.json'
import enDashboard from '@/locales/en/dashboard.json'
import enDutchPay from '@/locales/en/dutchPay.json'
import enNotification from '@/locales/en/notification.json'
import enLogin from '@/locales/en/login.json'
import enUser from '@/locales/en/user.json'
import enExport from '@/locales/en/export.json'
import enSettings from '@/locales/en/settings.json'

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// 네임스페이스 목록
export const NAMESPACES = [
  'common', 'layout', 'todo', 'calendar', 'memo',
  'timer', 'expense', 'budget', 'card', 'category', 'asset', 'dashboard', 'dutchPay',
  'notification', 'login', 'user', 'export', 'settings'
] as const
export type Namespace = typeof NAMESPACES[number]

// 리소스 번들
const resources = {
  ko: {
    common: koCommon,
    layout: koLayout,
    todo: koTodo,
    calendar: koCalendar,
    memo: koMemo,
    timer: koTimer,
    expense: koExpense,
    budget: koBudget,
    card: koCard,
    category: koCategory,
    asset: koAsset,
    dashboard: koDashboard,
    dutchPay: koDutchPay,
    notification: koNotification,
    login: koLogin,
    user: koUser,
    export: koExport,
    settings: koSettings,
  },
  en: {
    common: enCommon,
    layout: enLayout,
    todo: enTodo,
    calendar: enCalendar,
    memo: enMemo,
    timer: enTimer,
    expense: enExpense,
    budget: enBudget,
    card: enCard,
    category: enCategory,
    asset: enAsset,
    dashboard: enDashboard,
    dutchPay: enDutchPay,
    notification: enNotification,
    login: enLogin,
    user: enUser,
    export: enExport,
    settings: enSettings,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: NAMESPACES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

export { i18n }
