import { Injectable } from '@angular/core';
import { TimelineColumn, Timescale } from '../../models/timeline.model';

@Injectable({ providedIn: 'root' })
export class TimelineService {

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  getVisibleRange(center: Date, timescale: Timescale): { start: Date; end: Date } {
    // Pick reasonable defaults from the spec
    if (timescale === 'day') {
      const today = new Date();
      const start = this.startOfDay(this.addDays(today, -7));
      const end = this.addDays(start, 14); // 7 before + 7 after
      return { start, end };
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
  
  buildColumnsWindow(start: Date, timescale: Timescale, count: number): TimelineColumn[] {
    const startDay = this.startOfDay(start);
  
    if (timescale === 'day') {
      const end = this.addDays(startDay, count);
      return buildDayColumns(startDay, end);
    }
  
    if (timescale === 'week') {
      const s = startOfWeek(startDay);
      const end = addDays(s, count * 7);
      return buildWeekColumns(s, end);
    }
  
    // month
    const s = startOfMonth(startDay);
    const end = addMonths(s, count);
    return buildMonthColumns(s, end);
  }
  
  shiftStartByColumns(start: Date, timescale: Timescale, deltaCols: number): Date {
    if (timescale === 'day') return this.addDays(start, deltaCols);
    if (timescale === 'week') return this.addDays(start, deltaCols * 7);
    // month
    return addMonths(startOfMonth(start), deltaCols);
  }  

  dateToX(date: Date, columns: { start: Date; end: Date }[], colWidth: number): number {
    if (!columns.length) return 0;
  
    const time = date.getTime();
  
    // Clamp before range
    if (time <= columns[0].start.getTime()) return 0;
  
    // Clamp after range
    const last = columns[columns.length - 1];
    if (time >= last.end.getTime()) return columns.length * colWidth;
  
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const s = col.start.getTime();
      const e = col.end.getTime();
  
      if (time >= s && time < e) {
        const ratio = (time - s) / (e - s);
        return i * colWidth + ratio * colWidth;
      }
    }
  
    // fallback (shouldn't hit)
    return 0;
  }
   

  xToDate(x: number, columns: { start: Date; end: Date }[], colWidth: number): Date {
    if (!columns.length) return new Date();
  
    const totalWidth = columns.length * colWidth;
    const clamped = Math.max(0, Math.min(x, totalWidth - 1));
  
    const index = Math.floor(clamped / colWidth);
    const col = columns[Math.min(index, columns.length - 1)];
    const within = clamped - index * colWidth;
    const ratio = within / colWidth;
  
    const startMs = col.start.getTime();
    const endMs = col.end.getTime();
    const ms = startMs + ratio * (endMs - startMs);
  
    return new Date(ms);
  }
  
}

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
