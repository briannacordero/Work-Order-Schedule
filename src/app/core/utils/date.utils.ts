import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export function isoToStruct(iso: string): NgbDateStruct {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function structToIso(s: NgbDateStruct): string {
  const yyyy = String(s.year).padStart(4, '0');
  const mm = String(s.month).padStart(2, '0');
  const dd = String(s.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
