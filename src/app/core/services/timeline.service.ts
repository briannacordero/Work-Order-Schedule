import { Injectable } from '@angular/core';
import { TimelineColumn, Timescale } from '../../models/timeline.model';

@Injectable({ providedIn: 'root' })
export class TimelineService {

  getVisibleRange(center: Date, timescale: Timescale): { start: Date; end: Date } {
    // Pick reasonable defaults from the spec
    if (timescale === 'day') {
      return { start: addDays(startOfDay(center), -14), end: addDays(startOfDay(center), 15) };
    }
    if (timescale === 'week') {
      return { start: addMonths(startOfMonth(center), -2), end: addMonths(startOfMonth(center), 3) };
    }
    // month
    return { start: addMonths(startOfMonth(center), -6), end: addMonths(startOfMonth(center), 7) };
  }

  buildColumns(center: Date, timescale: Timescale): TimelineColumn[] {
    const { start, end } = this.getVisibleRange(center, timescale);

    if (timescale === 'day') return buildDayColumns(start, end);
    if (timescale === 'week') return buildWeekColumns(start, end);
    return buildMonthColumns(start, end);
  }
}

/** ---- helpers (kept simple + dependency-free) ---- */

function buildDayColumns(start: Date, end: Date): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  let d = startOfDay(start);
  const e = startOfDay(end);

  while (d < e) {
    const next = addDays(d, 1);
    cols.push({
      start: d,
      end: next,
      label: formatDayLabel(d), // e.g. "Aug 23"
    });
    d = next;
  }
  return cols;
}

function buildWeekColumns(start: Date, end: Date): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  let d = startOfWeek(start);
  const e = startOfDay(end);

  while (d < e) {
    const next = addDays(d, 7);
    cols.push({
      start: d,
      end: next,
      label: formatWeekLabel(d), // e.g. "Wk of Aug 19"
    });
    d = next;
  }
  return cols;
}

function buildMonthColumns(start: Date, end: Date): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  let d = startOfMonth(start);
  const e = startOfDay(end);

  while (d < e) {
    const next = addMonths(d, 1);
    cols.push({
      start: d,
      end: next,
      label: formatMonthLabel(d), // e.g. "Aug 2024"
    });
    d = next;
  }
  return cols;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  // Monday-start week
  const day = d.getDay(); // 0=Sun,1=Mon...
  const diff = (day === 0 ? -6 : 1) - day;
  return startOfDay(addDays(d, diff));
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

function formatWeekLabel(d: Date): string {
  return `Wk of ${d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}`;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
