import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday, isSameDay, isSameMonth } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'

export const getLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'ko'
  return lang === 'ko' ? ko : enUS
}

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd') => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: getLocale() })
}

export {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, isSameDay, isSameMonth,
}
