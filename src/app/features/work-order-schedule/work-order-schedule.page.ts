import { Component, OnInit } from '@angular/core';
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


export class WorkOrderSchedulePageComponent implements OnInit {
  private readonly STORAGE_KEY = 'naologic-work-orders-v1';

  ngOnInit(): void {
    this.orders = this.loadOrders();
    console.log('Loaded orders count:', this.orders.length);

  }

  private loadOrders(): WorkOrder[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [...WORK_ORDERS]; // first run fallback
  
      const parsed = JSON.parse(raw);
  
      if (!Array.isArray(parsed)) return [...WORK_ORDERS];
  
      const normalized = (parsed as any[]).filter(o =>
        typeof o?.id === 'string' &&
        typeof o?.name === 'string' &&
        typeof o?.workCenterId === 'string' &&
        typeof o?.status === 'string' &&
        typeof o?.startDate === 'string' &&
        typeof o?.endDate === 'string'
      ) as WorkOrder[];
  
      // ✅ IMPORTANT: if storage is empty/invalid, re-seed sample data
      return normalized.length ? normalized : [...WORK_ORDERS];
    } catch {
      return [...WORK_ORDERS];
    }
  }
  

  private persistOrders(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
    } catch {
      // ignore storage errors
    }
    console.log('Persisting orders count:', this.orders.length);

  }

  timescale: Timescale = 'day';

  orders: WorkOrder[] = [];

  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder?: WorkOrder;
  createContext?: { workCenterId: string; startDateIso?: string };

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
    this.createContext = { workCenterId }; // no startDateIso at all
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
    this.persistOrders();
  }

  onClosePanel() {
    this.panelOpen = false;
    this.selectedOrder = undefined;
    this.createContext = undefined;
  }


  onSaveOrder(order: WorkOrder) {
    const exists = this.orders.some(o => o.id === order.id);

    this.orders = exists
      ? this.orders.map(o => (o.id === order.id ? { ...order } : o))
      : [...this.orders, order];

    this.persistOrders();
    this.onClosePanel?.(); // if you have it
    this.panelOpen = false; // if you use this pattern
  }
}
