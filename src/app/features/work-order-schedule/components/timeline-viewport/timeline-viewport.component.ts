import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineService } from '../../../../core/services/timeline.service';
import { TimelineColumn, Timescale } from '../../../../models/timeline.model';
import { WorkOrder } from '../../../../models/work-order.model';
import { WorkCenter } from '../../../../models/work-center.model';

import { WORK_CENTERS, WORK_ORDERS } from '../../data/sample-data';

import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';

@Component({
  standalone: true,
  selector: 'app-timeline-viewport',
  imports: [CommonModule, WorkOrderBarComponent],
  templateUrl: './timeline-viewport.component.html',
  styleUrl: './timeline-viewport.component.scss',
})
export class TimelineViewportComponent implements OnChanges {
  @Input() timescale: Timescale = 'day';
  @Input() orders: WorkOrder[] = this.loadOrders();
  workCenters = WORK_CENTERS;
  @Input() selectedWorkCenterId: string | null = null;
  
  @Output() editOrder = new EventEmitter<WorkOrder>();
  @Output() createOrder = new EventEmitter<{ workCenterId: string; startDateIso: string }>();
  @Output() deleteOrder = new EventEmitter<WorkOrder>();
  @Output() selectWorkCenter = new EventEmitter<string>();
  

  @ViewChild('timelineScroll') timelineScroll!: ElementRef<HTMLElement>;


  columns: TimelineColumn[] = [];
  colWidth = 80;

  now = new Date();
  currentColIndex = -1;
  currentTagLeftPx = 0;
  currentLineLeftPx = 0;
  showCurrentTag = false;
  currentTagText = '';

  constructor(private timeline: TimelineService) {
    this.build();
  }

  panelOpen = false;
  selectedOrder?: WorkOrder;
  createContext?: { workCenterId: string; startDateIso: string };

  openMenuOrderId: string | number | null = null;

toggleOrderMenu(order: any) {
  // adjust if your WorkOrder id field name differs
  const id = order.id;
  this.openMenuOrderId = this.openMenuOrderId === id ? null : id;
}

openMenuId: string | number | null = null;

onToggleMenu(orderId: string | number) {
  this.openMenuId = this.openMenuId === orderId ? null : orderId;
}

closeMenus() {
  this.openMenuOrderId = null;
}

  onClosePanel() {
    this.closeMenus();
    this.panelOpen = false;
    this.selectedOrder = undefined;
    this.createContext = undefined;
  }

  onEditOrder(order: WorkOrder) {
    this.closeMenus();
    this.editOrder.emit(order);
  }

  onSaveOrder(order: WorkOrder) {
    const exists = this.orders.some(o => o.id === order.id);
  
    debugOverlaps(order, this.orders);

    this.orders = exists
      ? this.orders.map(o => (o.id === order.id ? { ...order } : o))
      : [...this.orders, order];
  
    this.persistOrders();
  
    this.closeMenus();
    this.panelOpen = false;
    this.selectedOrder = undefined;
    this.createContext = undefined;
  }
  
  
  onDeleteOrder(order: WorkOrder) {
    this.orders = this.orders.filter(o => o.id !== order.id);
    this.persistOrders();
  }
  

  trackByOrderId(_: number, order: WorkOrder) {
    return order.id;
  }
  
  private readonly STORAGE_KEY = 'naologic-work-orders-v1';

private loadOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [...WORK_ORDERS]; // first run fallback

    const parsed = JSON.parse(raw) as WorkOrder[];
    // minimal validation / normalization
    if (!Array.isArray(parsed)) return [...WORK_ORDERS];

    return parsed.filter(o =>
      typeof o?.id === 'string' &&
      typeof o?.name === 'string' &&
      typeof o?.workCenterId === 'string' &&
      typeof o?.status === 'string' &&
      typeof o?.startDate === 'string' &&
      typeof o?.endDate === 'string'
    );
  } catch {
    return [...WORK_ORDERS];
  }
}

private persistOrders(): void {
  try {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
  } catch {
    // ignore quota / private mode errors for now
  }
}

  private prevScale?: Timescale;

  ngOnChanges() {
    const scaleChanged = this.prevScale !== this.timescale;
    this.prevScale = this.timescale;
  
    if (scaleChanged) {
      this.windowStart = undefined as any;
    }
  
    this.build();
  
    if (scaleChanged) {
      queueMicrotask(() => this.scrollToCurrentPeriod());
    }
  }  

  private scrollToCurrentPeriod() {
    if (!this.timelineScroll) return;
  
    const now = new Date();
    const x = this.timeline.dateToX(now, this.columns, this.colWidth);
  
    const el = this.timelineScroll.nativeElement;
    el.scrollLeft = Math.max(0, x - el.clientWidth / 3);
  }

  private dateKey(d: Date): string {
    // local date key, no timezone surprises
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  
  

  onScroll() {
    if (!this.timelineScroll) return;
  
    const el = this.timelineScroll.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
  
    // near left edge → shift earlier
    if (el.scrollLeft < this.edgeThresholdPx) {
      this.shiftWindow(-this.shiftCols);
      return;
    }
  
    // near right edge → shift later
    if (el.scrollLeft > maxScroll - this.edgeThresholdPx) {
      this.shiftWindow(this.shiftCols);
      return;
    }
  }

  jumpToNow() {
    const scroller = this.timelineScroll?.nativeElement;
    if (!scroller) return;
  
    // determine col width from DOM (works for day/week/month)
    const firstCell = scroller.querySelector('.timeline__header .timeline__cell') as HTMLElement | null;
    const colWidth = firstCell?.offsetWidth ?? 80;
  
    const idx = this.currentColIndex ?? 0;
  
    const targetLeft = Math.max(
      0,
      idx * colWidth - scroller.clientWidth / 2 + colWidth / 2
    );
  
    scroller.scrollTo({ left: targetLeft, behavior: 'smooth' });
  
    // if you have these fields in viewport
    this.showCurrentTag = true;
  }
  
  
  private shiftWindow(deltaCols: number) {
    if (!this.timelineScroll) return;
  
    const el = this.timelineScroll.nativeElement;
  
    const oldStart = this.windowStart;
    const newStart = this.clampStart(this.timeline.shiftStartByColumns(oldStart, this.timescale, deltaCols));
  
    // if clamping prevented movement, do nothing
    if (newStart.getTime() === oldStart.getTime()) return;
  
    this.windowStart = newStart;
    this.columns = this.timeline.buildColumnsWindow(this.windowStart, this.timescale, this.windowCols);

    queueMicrotask(() => {
      this.syncColWidthFromDom();
      this.updateCurrentMarkers();
    });
    
    el.scrollLeft += deltaCols * this.colWidth;
    
  }
  

  private build() {
    this.configureWindowForScale();
  
    if (!this.windowStart) {
      this.initWindowStart();
    } else {
      this.windowStart = this.clampStart(this.windowStart);
    }
  
    this.columns = this.timeline.buildColumnsWindow(
      this.windowStart,
      this.timescale,
      this.windowCols
    );
  
    // IMPORTANT: wait until DOM updates, then measure width, then compute markers
    queueMicrotask(() => {
      this.syncColWidthFromDom();
      this.updateCurrentMarkers();
    });
  }
  

  private syncColWidthFromDom(): void {
    const scroller = this.timelineScroll?.nativeElement;
    if (!scroller) return;
  
    const firstCell = scroller.querySelector(
      '.timeline__header .timeline__cell'
    ) as HTMLElement | null;
  
    const w = firstCell?.offsetWidth;
    if (w && w > 0) this.colWidth = w;
  }  
  
  private updateCurrentMarkers(): void {
    const today = new Date();
    this.now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
    const nowKey = this.dateKey(this.now);
  
    this.currentColIndex = this.columns.findIndex(c => {
      // For day/week/month columns, start is the anchor we care about
      const startKey = this.dateKey(c.start);
  
      if (this.timescale === 'day') {
        // each column is one day
        return startKey === nowKey;
      }
  
      if (this.timescale === 'week') {
        // now is within [start, end] inclusive by date
        const start = this.dateKey(c.start);
        const end = this.dateKey(new Date(c.end.getFullYear(), c.end.getMonth(), c.end.getDate() - 1)); 
        // assumes c.end is exclusive (start of next period)
        return nowKey >= start && nowKey <= end;
      }
  
      // month: match month+year of column start
      return (
        c.start.getFullYear() === this.now.getFullYear() &&
        c.start.getMonth() === this.now.getMonth()
      );
    });
  
    this.showCurrentTag = this.currentColIndex >= 0;
  
    this.currentTagText =
      this.timescale === 'day' ? 'Today'
      : this.timescale === 'week' ? 'Current week'
      : 'Current month';
  
    if (!this.showCurrentTag) {
      this.currentTagLeftPx = 0;
      this.currentLineLeftPx = 0;
      return;
    }
  
    const colStartX = this.currentColIndex * this.colWidth;

    const TAG_OFFSET = 28;
    this.currentTagLeftPx = colStartX + TAG_OFFSET;

    this.currentLineLeftPx = colStartX;
    
  }  
  

  private toISODateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  

  onRowSelect(wcId: string) {
    this.selectWorkCenter.emit(wcId);
  }
  
  onRowClick(event: MouseEvent, wc: WorkCenter) {
    if (!this.timelineScroll) return;
  
    const scrollLeft = this.timelineScroll.nativeElement.scrollLeft;
  
    const rowEl = event.currentTarget as HTMLElement;
    const rect = rowEl.getBoundingClientRect();
    const xWithinRow = event.clientX - rect.left;
  
    const x = xWithinRow + scrollLeft;
    const clickedDate = this.timeline.xToDate(x, this.columns, this.colWidth);
  
    this.createOrder.emit({
      workCenterId: wc.id,
      startDateIso: this.dateKey(clickedDate),
    });

    console.log('Row click create:', wc.id);

  }  

  getOrdersForCenter(workCenterId: string): WorkOrder[] {
    return this.orders.filter(
      (order) => order.workCenterId === workCenterId
    );
  }

  getRenderableOrdersForCenter(workCenterId: string) {
    return this.getOrdersForCenter(workCenterId).filter(o => (o.name ?? '').trim().length > 0);
  }  

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
  private parseIsoLocal(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  private addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private startOfWeek(d: Date): Date {
    // Monday-start week
    const day = d.getDay(); // 0=Sun,1=Mon...
    const diff = (day === 0 ? -6 : 1) - day;
    return this.startOfDay(this.addDays(d, diff));
  }
  
  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  
  private addMonths(d: Date, months: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + months, 1);
  }  

    // clamp year
  private yearStart = new Date(2026, 0, 1);
  private yearEndExclusive = new Date(2027, 0, 1); // exclusive end

  private windowStart!: Date;

  // tune per view
  private windowCols = 90;   // day default
  private shiftCols = 30;    // how much we shift when near edge
  private edgeThresholdPx = 300; // when to shift

  private configureWindowForScale() {
    if (this.timescale === 'day') {
      this.windowCols = 120; // ~4 months
      this.shiftCols = 60;   // shift by ~2 months
    } else if (this.timescale === 'week') {
      this.windowCols = 26;  // ~6 months
      this.shiftCols = 13;   // ~3 months
    } else {
      this.windowCols = 12;  // months: show whole year (cheap)
      this.shiftCols = 0;
    }
  }  

  private clampStart(start: Date): Date {
    let maxStart: Date;
  
    if (this.timescale === 'day') {
      maxStart = this.addDays(this.yearEndExclusive, -this.windowCols);
    } else if (this.timescale === 'week') {
      maxStart = this.addDays(this.yearEndExclusive, -(this.windowCols * 7));
    } else {
      maxStart = this.addMonths(this.yearEndExclusive, -this.windowCols);
    }
  
    if (start < this.yearStart) return this.yearStart;
    if (start > maxStart) return maxStart;
    return start;
  }  
  
  
  private initWindowStart() {
    const today = this.startOfDay(new Date());
  
    if (this.timescale === 'day') {
      // show ~2 months before today
      this.windowStart = this.clampStart(this.addDays(today, -60));
      return;
    }
  
    if (this.timescale === 'week') {
      const start = this.startOfWeek(today);
      // show ~8 weeks before current week
      this.windowStart = this.clampStart(this.addDays(start, -7 * 8));
      return;
    }
  
    // month
    const start = this.startOfMonth(today);
    // show 2 months before current month
    this.windowStart = this.clampStart(this.addMonths(start, -2));
  }
  
  
  getLeft(order: WorkOrder): number {
    const start = this.parseIsoLocal(order.startDate);
    return this.timeline.dateToX(start, this.columns, this.colWidth);
  }
  
  getWidth(order: WorkOrder): number {
    const start = this.parseIsoLocal(order.startDate);
    const endExclusive = this.addDays(this.parseIsoLocal(order.endDate), 1);
  
    const startX = this.timeline.dateToX(start, this.columns, this.colWidth);
    const endX = this.timeline.dateToX(endExclusive, this.columns, this.colWidth);
  
    return Math.max(24, endX - startX);
  }  
  
}

type OrderLike = { id: string; workCenterId: any; startDate: string; endDate: string; name?: string };

function toDayKey(iso: string) {
  // Works for "YYYY-MM-DD" or full ISO. Normalizes to YYYY-MM-DD.
  return iso.slice(0, 10);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const A0 = toDayKey(aStart);
  const A1 = toDayKey(aEnd);
  const B0 = toDayKey(bStart);
  const B1 = toDayKey(bEnd);

  // Inclusive overlap (counts touching endpoints as overlap)
  return A0 <= B1 && B0 <= A1;
}

function debugOverlaps(newOrder: OrderLike, orders: OrderLike[]) {
  const nWC = String(newOrder.workCenterId);
  const n0 = toDayKey(newOrder.startDate);
  const n1 = toDayKey(newOrder.endDate);

  console.group("OVERLAP DEBUG");
  console.log("NEW:", { id: newOrder.id, wc: newOrder.workCenterId, n0, n1 });

  const candidates = orders
    .filter(o => String(o.workCenterId) === nWC)
    .filter(o => o.id !== newOrder.id);

  console.log("Candidates same WC (excluding self):", candidates.length);

  for (const o of candidates) {
    const o0 = toDayKey(o.startDate);
    const o1 = toDayKey(o.endDate);
    const hit = overlaps(n0, n1, o0, o1);

    console.log(
      hit ? "❌ OVERLAP" : "✅ ok",
      { id: o.id, name: o.name, wc: o.workCenterId, o0, o1 }
    );
  }

  console.groupEnd();
}

