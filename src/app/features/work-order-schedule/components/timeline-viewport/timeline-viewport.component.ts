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
  @Input() orders: WorkOrder[] = [...WORK_ORDERS];
  workCenters = WORK_CENTERS;

  @Output() editOrder = new EventEmitter<WorkOrder>();
  @Output() createOrder = new EventEmitter<{ workCenterId: string; startDateIso: string }>();
  @Output() deleteOrder = new EventEmitter<WorkOrder>();


  @ViewChild('timelineScroll') timelineScroll!: ElementRef<HTMLElement>;


  columns: TimelineColumn[] = [];
  colWidth = 80;


  constructor(private timeline: TimelineService) {
    this.build();
  }

  onEditOrder(order: WorkOrder) {
    this.editOrder.emit(order);
  }
  
  
  onDeleteOrder(order: WorkOrder) {
    this.deleteOrder.emit(order);
  }

  trackByOrderId(_: number, order: WorkOrder) {
    return order.id;
  }
  

  ngOnChanges() {
    this.build();
  }

  private build() {
    this.columns = this.timeline.buildColumns(new Date(), this.timescale);
  }

  private toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
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

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
  getLeft(order: WorkOrder): number {
    const start = this.startOfDay(new Date(order.startDate));
    const x = this.timeline.dateToX(start, this.columns, this.colWidth);
  
    // clamp so it never disappears completely
    return Math.max(0, x);
  }

  getWidth(order: WorkOrder): number {
    const start = new Date(order.startDate);

    const endExclusive = new Date(order.endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    const startX = this.timeline.dateToX(start, this.columns, this.colWidth);
    const endX = this.timeline.dateToX(endExclusive, this.columns, this.colWidth);

    if (startX < 0 || endX < 0) {
      return this.colWidth; // fallback
    }
    return Math.max(endX - startX, this.colWidth);
  }
}
