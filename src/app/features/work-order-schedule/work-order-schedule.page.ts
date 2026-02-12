import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimescaleSelectComponent } from './components/timescale-select/timescale-select.component';
import { TimelineViewportComponent } from './components/timeline-viewport/timeline-viewport.component';
import { WorkOrderPanelComponent } from './components/work-order-panel/work-order-panel.component';
import { Timescale } from '../../models/timeline.model';
import { WORK_ORDERS } from './data/sample-data';
import { WorkOrder } from '../../models/work-order.model';
import { rangesOverlapInclusive } from '../../core/utils/overlap.utils';

@Component({
  standalone: true,
  selector: 'app-work-order-schedule-page',
  imports: [CommonModule, TimescaleSelectComponent, TimelineViewportComponent, WorkOrderPanelComponent],
  templateUrl: './work-order-schedule.page.html',
  styleUrl: './work-order-schedule.page.scss',
})


export class WorkOrderSchedulePageComponent {
  timescale: Timescale = 'day';

  orders: WorkOrder[] = [];

  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder?: WorkOrder;
  createContext?: { workCenterId: string; startDateIso: string };

  onCreateOrder(req: { workCenterId: string; startDateIso: string }) {
    console.log('Create request received:', req);
    this.panelMode = 'create';
    this.selectedOrder = undefined;
    this.createContext = req;
    this.panelOpen = true;
  }

  selectedWorkCenterId: string | null = null;

  onSelectWorkCenter(workCenterId: string) {
    const existing = this.orders.find(o => o.workCenterId === workCenterId);
  
    if (existing) {
      this.onEditOrder(existing);
      return;
    }
  
    this.panelMode = 'create';
    this.selectedOrder = undefined;
    this.createContext = {
      workCenterId,
      startDateIso: new Date().toISOString().slice(0, 10),
    };
    this.panelOpen = true;
  }  

  onTimescaleChange(scale: Timescale) {
    this.timescale = scale;
  }

  onEditOrder(order: WorkOrder) {
    this.panelMode = 'edit';
    this.selectedOrder = order;
    this.panelOpen = true;
  }

  onDeleteOrder(order: WorkOrder) {
    this.orders = this.orders.filter(o => o.id !== order.id);
  }  

  onClosePanel() {
    this.panelOpen = false;
    this.selectedOrder = undefined;
    this.createContext = undefined;
  }


  onSaveOrder(order: WorkOrder) {
    if (this.panelMode === 'edit') {
      this.orders = this.orders.map(o => (o.id === order.id ? { ...order } : o));
    } else {
      this.orders = [...this.orders, order];
    }
    this.onClosePanel();
  }
}
