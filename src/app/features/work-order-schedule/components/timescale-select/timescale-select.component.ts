import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Timescale } from '../../../../models/timeline.model';

@Component({
  standalone: true,
  selector: 'app-timescale-select',
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './timescale-select.component.html',
  styleUrl: './timescale-select.component.scss',
})
export class TimescaleSelectComponent {
  @Input() value: Timescale = 'day';
  @Output() valueChange = new EventEmitter<Timescale>();

  options = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  onChange(next: Timescale) {
    this.valueChange.emit(next);
  }
}
