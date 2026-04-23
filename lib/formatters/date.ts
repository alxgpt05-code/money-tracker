import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function formatShortDate(date: Date | string) {
  return format(new Date(date), "d MMM", { locale: ru });
}

export function formatFullDate(date: Date | string) {
  return format(new Date(date), "d MMMM yyyy", { locale: ru });
}

export function formatMonthLabel(date: Date | string) {
  return format(new Date(date), "LLLL yyyy", { locale: ru });
}
