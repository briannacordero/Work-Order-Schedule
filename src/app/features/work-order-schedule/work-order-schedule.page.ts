import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimescaleSelectComponent } from './components/timescale-select/timescale-select.component';
import { TimelineViewportComponent } from './components/timeline-viewport/timeline-viewport.component';
import { WorkOrderPanelComponent } from './components/work-order-panel/work-order-panel.component';
import { Timescale } from '../../models/timeline.model';
import { WorkOrder } from '../../models/work-order.model';

@Component({
  standalone: true,
  selector: 'app-work-order-schedule-page',
  imports: [CommonModule, TimescaleSelectComponent, TimelineViewportComponent, WorkOrderPanelComponent],
  templateUrl: './work-order-schedule.page.html',
  styleUrl: './work-order-schedule.page.scss',
})
export class WorkOrderSchedulePageComponent {
  timescale: Timescale = 'day';

  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder?: WorkOrder;

  onTimescaleChange(scale: Timescale) {
    this.timescale = scale;
  }

  onEditOrder(order: WorkOrder) {
    this.panelMode = 'edit';
    this.selectedOrder = order;
    this.panelOpen = true;
  }

  onClosePanel() {
    this.panelOpen = false;
    this.selectedOrder = undefined;
  }

  onSaveOrder(order: WorkOrder) {
    console.log('Saved payload:', order);
    // Next phase
    this.onClosePanel();
  }
}
