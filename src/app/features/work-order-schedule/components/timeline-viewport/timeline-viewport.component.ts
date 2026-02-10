import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineService } from '../../../../core/services/timeline.service';
import { TimelineColumn, Timescale } from '../../../../models/timeline.model';

@Component({
  standalone: true,
  selector: 'app-timeline-viewport',
  imports: [CommonModule],
  templateUrl: './timeline-viewport.component.html',
  styleUrl: './timeline-viewport.component.scss',
})
export class TimelineViewportComponent implements OnChanges {
  @Input() timescale: Timescale = 'day';

  workCenters = [
    'Extrusion Line A',
    'CNC Machine 1',
    'Assembly Station',
    'Quality Control',
    'Packaging Line',
  ];

  columns: TimelineColumn[] = [];

  constructor(private timeline: TimelineService) {
    this.build();
  }

  ngOnChanges() {
    this.build();
  }

  private build() {
    this.columns = this.timeline.buildColumns(new Date(), this.timescale);
  }
}
