import { WorkCenter } from '../../../models/work-center.model';
import { WorkOrder } from '../../../models/work-order.model';

export const WORK_CENTERS: WorkCenter[] = [
  { id: 'wc-1', name: 'Extrusion Line A' },
  { id: 'wc-2', name: 'CNC Machine 1' },
  { id: 'wc-3', name: 'Assembly Station' },
  { id: 'wc-4', name: 'Quality Control' },
  { id: 'wc-5', name: 'Packaging Line' },
];

export const WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-1',
    name: 'Order Alpha',
    workCenterId: 'wc-1',
    status: 'in-progress',
    startDate: '2025-01-15',
    endDate: '2025-01-20',
  },
  {
    id: 'wo-2',
    name: 'Order Beta',
    workCenterId: 'wc-1',
    status: 'complete',
    startDate: '2025-01-22',
    endDate: '2025-01-27',
  },
  {
    id: 'wo-3',
    name: 'Order Gamma',
    workCenterId: 'wc-2',
    status: 'open',
    startDate: '2025-01-18',
    endDate: '2025-01-25',
  },
  {
    id: 'wo-4',
    name: 'Order Delta',
    workCenterId: 'wc-3',
    status: 'blocked',
    startDate: '2025-01-19',
    endDate: '2025-01-28',
  },
];
