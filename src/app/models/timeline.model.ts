export type Timescale = 'day' | 'week' | 'month';

export interface TimelineColumn {
  start: Date;   // start of the column range
  end: Date;     // end of the column range (exclusive is easiest)
  label: string; // text shown in header
}
