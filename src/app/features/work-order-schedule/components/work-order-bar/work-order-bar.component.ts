import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrder } from '../../../../models/work-order.model';

@Component({
  standalone: true,
  selector: 'app-work-order-bar',
  imports: [CommonModule],
  templateUrl: './work-order-bar.component.html',
  styleUrl: './work-order-bar.component.scss',
})
export class WorkOrderBarComponent {
  @Input() order!: WorkOrder;
  @Input() left = 0;
  @Input() width = 0;

  @Input() menuOpen = false;

  @Output() edit = new EventEmitter<WorkOrder>();
  @Output() delete = new EventEmitter<WorkOrder>();

  @Output() menuToggle = new EventEmitter<WorkOrder>();

  get statusLabel(): string {
    switch (this.order.status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In progress';
      case 'complete': return 'Complete';
      case 'blocked': return 'Blocked';
      default: return '';
    }
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuToggle.emit(this.order);
  }

  onEdit(event?: MouseEvent) {
    event?.stopPropagation();
    this.edit.emit(this.order);
  }

  onDelete(event?: MouseEvent) {
    event?.stopPropagation();
    this.delete.emit(this.order);
  }
}
