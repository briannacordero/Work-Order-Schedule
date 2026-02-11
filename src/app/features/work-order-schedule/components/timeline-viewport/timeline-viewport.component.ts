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
  @Input() selectedWorkCenterId: string | null = null;
  
  @Output() editOrder = new EventEmitter<WorkOrder>();
  @Output() createOrder = new EventEmitter<{ workCenterId: string; startDateIso: string }>();
  @Output() deleteOrder = new EventEmitter<WorkOrder>();
  @Output() selectWorkCenter = new EventEmitter<string>();
  

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
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
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
