import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
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

  @Output() edit = new EventEmitter<WorkOrder>();
  @Output() delete = new EventEmitter<WorkOrder>();

  @HostListener('document:click')
  closeMenu() {
    this.menuOpen = false;
  }

  @HostListener('document:click')
  onDocClick() {
    this.menuOpen = false;
  }

  get statusLabel(): string {
    switch (this.order.status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In progress';
      case 'complete': return 'Complete';
      case 'blocked': return 'Blocked';
    }
  }
  
  menuOpen = false;

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onEdit() {
    this.menuOpen = false;
    this.edit.emit(this.order);
  }

  onDelete() {
    this.menuOpen = false;
    this.delete.emit(this.order);
  }
}
