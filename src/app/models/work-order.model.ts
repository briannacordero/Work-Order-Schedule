export type WorkOrderStatus =
  | 'open'
  | 'in-progress'
  | 'complete'
  | 'blocked';

export interface WorkOrder {
  id: string;
  name: string;
  workCenterId: string;
  status: WorkOrderStatus;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}
