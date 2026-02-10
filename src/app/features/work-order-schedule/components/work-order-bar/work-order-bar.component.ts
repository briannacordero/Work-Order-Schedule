import { Component, Input } from '@angular/core';
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
}
