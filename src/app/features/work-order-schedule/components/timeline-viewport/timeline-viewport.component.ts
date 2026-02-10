import { Component, Input, OnChanges } from '@angular/core';
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

  columns: TimelineColumn[] = [];
  colWidth = 80;

  workCenters = WORK_CENTERS;
  orders = WORK_ORDERS;

  constructor(private timeline: TimelineService) {
    this.build();
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
    return this.timeline.dateToX(
      new Date(order.startDate),
      this.columns,
      this.colWidth
    );
  }

  getWidth(order: WorkOrder): number {
    const startX = this.timeline.dateToX(
      new Date(order.startDate),
      this.columns,
      this.colWidth
    );

    const endX = this.timeline.dateToX(
      new Date(order.endDate),
      this.columns,
      this.colWidth
    );

    return Math.max(endX - startX, this.colWidth * 0.5);
  }
}
