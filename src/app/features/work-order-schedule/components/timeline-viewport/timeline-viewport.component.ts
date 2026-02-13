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

  onClosePanel() {
    this.panelOpen = false;
    this.selectedOrder = undefined;
    this.createContext = undefined;
  }

  onEditOrder(order: WorkOrder) {
    this.editOrder.emit(order);
  }
  onSaveOrder(order: WorkOrder) {
    const exists = this.orders.some(o => o.id === order.id);
  
    this.orders = exists
      ? this.orders.map(o => (o.id === order.id ? { ...order } : o))
      : [...this.orders, order];
  
    this.persistOrders();
  
    // close panel if you have it; otherwise remove this line
    this.panelOpen = false;
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
  
  private shiftWindow(deltaCols: number) {
    if (!this.timelineScroll) return;
  
    const el = this.timelineScroll.nativeElement;
  
    const oldStart = this.windowStart;
    const newStart = this.clampStart(this.timeline.shiftStartByColumns(oldStart, this.timescale, deltaCols));
  
    // if clamping prevented movement, do nothing
    if (newStart.getTime() === oldStart.getTime()) return;
  
    this.windowStart = newStart;
    this.columns = this.timeline.buildColumnsWindow(this.windowStart, this.timescale, this.windowCols);
    this.updateCurrentMarkers();    
  
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
  
    this.updateCurrentMarkers(); // 👈 ADD THIS LINE HERE
  }
  

  private updateCurrentMarkers(): void {
    // IMPORTANT: use a fixed "today" value (no time jitter)
    const today = new Date();
    this.now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
    const nowMs = this.now.getTime();
    this.currentColIndex = this.columns.findIndex(
      c => nowMs >= c.start.getTime() && nowMs < c.end.getTime()
    );
  
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
  
    this.currentTagLeftPx = this.currentColIndex * this.colWidth + this.colWidth / 2;
    this.currentLineLeftPx = this.timeline.dateToX(this.now, this.columns, this.colWidth);
  }
  

  private toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
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
      startDateIso: clickedDate.toISOString().slice(0, 10),
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
