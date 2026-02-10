import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 각 언어별 네임스페이스 import
import koCommon from '@/locales/ko/common.json'
import koLayout from '@/locales/ko/layout.json'
import koTodo from '@/locales/ko/todo.json'
import koCalendar from '@/locales/ko/calendar.json'
import koMemo from '@/locales/ko/memo.json'
import koCalculator from '@/locales/ko/calculator.json'
import koTimer from '@/locales/ko/timer.json'
import koExpense from '@/locales/ko/expense.json'
import koAsset from '@/locales/ko/asset.json'
import koDashboard from '@/locales/ko/dashboard.json'
import koDutchPay from '@/locales/ko/dutchPay.json'
import koNotification from '@/locales/ko/notification.json'
import koGroup from '@/locales/ko/group.json'
import koAlbum from '@/locales/ko/album.json'

import enCommon from '@/locales/en/common.json'
import enLayout from '@/locales/en/layout.json'
import enTodo from '@/locales/en/todo.json'
import enCalendar from '@/locales/en/calendar.json'
import enMemo from '@/locales/en/memo.json'
import enCalculator from '@/locales/en/calculator.json'
import enTimer from '@/locales/en/timer.json'
import enExpense from '@/locales/en/expense.json'
import enAsset from '@/locales/en/asset.json'
import enDashboard from '@/locales/en/dashboard.json'
import enDutchPay from '@/locales/en/dutchPay.json'
import enNotification from '@/locales/en/notification.json'
import enGroup from '@/locales/en/group.json'
import enAlbum from '@/locales/en/album.json'

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// 네임스페이스 목록
export const NAMESPACES = [
  'common', 'layout', 'todo', 'calendar', 'memo', 'calculator',
  'timer', 'expense', 'asset', 'dashboard', 'dutchPay',
  'notification', 'group', 'album'
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
    calculator: koCalculator,
    timer: koTimer,
    expense: koExpense,
    asset: koAsset,
    dashboard: koDashboard,
    dutchPay: koDutchPay,
    notification: koNotification,
    group: koGroup,
    album: koAlbum,
  },
  en: {
    common: enCommon,
    layout: enLayout,
    todo: enTodo,
    calendar: enCalendar,
    memo: enMemo,
    calculator: enCalculator,
    timer: enTimer,
    expense: enExpense,
    asset: enAsset,
    dashboard: enDashboard,
    dutchPay: enDutchPay,
    notification: enNotification,
    group: enGroup,
    album: enAlbum,
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
