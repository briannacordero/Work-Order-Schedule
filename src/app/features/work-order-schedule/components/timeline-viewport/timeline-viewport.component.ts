import { Component, Input, OnChanges, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineService } from '../../../../core/services/timeline.service';
import { TimelineColumn, Timescale } from '../../../../models/timeline.model';
import { WorkOrder } from '../../../../models/work-order.model';

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

  @Output() editOrder = new EventEmitter<WorkOrder>();

  columns: TimelineColumn[] = [];
  colWidth = 80;

  workCenters = WORK_CENTERS;
  orders = WORK_ORDERS;

  constructor(private timeline: TimelineService) {
    this.build();
  }

  onEditOrder(order: WorkOrder) {
    this.editOrder.emit(order);
  }
  
  
  onDeleteOrder(order: WorkOrder) {
    this.orders = this.orders.filter(o => o.id !== order.id);
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


  getOrdersForCenter(workCenterId: string): WorkOrder[] {
    return this.orders.filter(
      (order) => order.workCenterId === workCenterId
    );
  }

  getLeft(order: WorkOrder): number {
    const startX = this.timeline.dateToX(
      new Date(order.startDate),
      this.columns,
      this.colWidth
    );
    return Math.max(startX, 0);
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
