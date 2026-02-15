export type Timescale = 'day' | 'week' | 'month';

export interface TimelineColumn {
  start: Date;   // start of the column range
  end: Date;     // end of the column range
  label: string; // text shown in header
}
