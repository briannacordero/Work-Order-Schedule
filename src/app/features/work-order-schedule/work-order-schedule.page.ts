import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineViewportComponent } from './components/timeline-viewport/timeline-viewport.component';
import { TimescaleSelectComponent } from './components/timescale-select/timescale-select.component';
import { Timescale } from '../../models/timeline.model';

@Component({
  standalone: true,
  selector: 'app-work-order-schedule-page',
  imports: [
    CommonModule,
    TimelineViewportComponent,
    TimescaleSelectComponent,
  ],
  templateUrl: './work-order-schedule.page.html',
  styleUrl: './work-order-schedule.page.scss',
})
export class WorkOrderSchedulePageComponent {
  timescale: Timescale = 'day';

  onTimescaleChange(scale: Timescale) {
    this.timescale = scale;
  }
}
