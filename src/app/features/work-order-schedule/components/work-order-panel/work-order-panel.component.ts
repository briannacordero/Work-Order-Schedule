import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrder } from '../../../../models/work-order.model';
import { WorkOrderFormComponent } from '../work-order-form/work-order-form.component';

type Mode = 'create' | 'edit';

@Component({
  standalone: true,
  selector: 'app-work-order-panel',
  imports: [CommonModule, WorkOrderFormComponent],
  templateUrl: './work-order-panel.component.html',
  styleUrl: './work-order-panel.component.scss',
})
export class WorkOrderPanelComponent {
  @Input() open = false;
  @Input() mode: Mode = 'create';
  @Input() initial?: WorkOrder;
  @Input() workCenterId?: string;
  @Input() existingOrders: WorkOrder[] = [];
  @Input() prefillStartDateIso?: string;


  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<WorkOrder>();

  onBackdropClick() {
    this.close.emit();
  }
}
