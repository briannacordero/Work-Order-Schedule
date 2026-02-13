import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { WorkOrder, WorkOrderStatus } from '../../../../models/work-order.model';
import { rangesOverlapInclusive } from '../../../../core/utils/overlap.utils';
import { isoToStruct, structToIso } from '../../../../core/utils/date.utils';

type Mode = 'create' | 'edit';

@Component({
  standalone: true,
  selector: 'app-work-order-form',
  imports: [CommonModule, ReactiveFormsModule, NgbDatepickerModule, NgSelectModule],
  templateUrl: './work-order-form.component.html',
  styleUrl: './work-order-form.component.scss',
})
export class WorkOrderFormComponent implements OnChanges {
  @Input() mode: Mode = 'create';
  @Input() initial?: WorkOrder;
  @Output() cancel = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<WorkOrder>();
  @Input() workCenterId?: string;
  @Input() existingOrders: WorkOrder[] = [];
  @Input() prefillStartDateIso?: string;

  statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'blocked', label: 'Blocked' },
  ] as const;  

  statusLabel(s: WorkOrderStatus): string {
    switch (s) {
      case 'open':
        return 'Open';
      case 'in-progress':
        return 'In progress';
      case 'complete':
        return 'Complete';
      case 'blocked':
        return 'Blocked';
    }
  }  

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<WorkOrderStatus>('open', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
    endDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
  });

  private addDaysIso(iso: string, days: number): string {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  
  private buildValidators(): void {
    this.form.setValidators([
      this.endAfterStartValidator(),
      this.noOverlapValidator(),
    ]);
    this.form.updateValueAndValidity({ emitEvent: false });
  }
  
  private endAfterStartValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const start = this.form.controls.startDate.value;
      const end = this.form.controls.endDate.value;
      if (!start || !end) return null;
  
      const startIso = structToIso(start);
      const endIso = structToIso(end);
  
      if (new Date(endIso) < new Date(startIso)) {
        return { endBeforeStart: true };
      }
      return null;
    };
  }
  
  private noOverlapValidator(): ValidatorFn {
    return (_: AbstractControl): ValidationErrors | null => {
      const start = this.form.controls.startDate.value;
      const end = this.form.controls.endDate.value;
      if (!start || !end) return null;
  
      const wcId = this.workCenterId ?? this.initial?.workCenterId;
      if (!wcId) return null;
  
      const startIso = structToIso(start);
      const endIso = structToIso(end);
  
      const editingId = this.initial?.id;
  
      const conflicts = this.existingOrders
        .filter(o => o.workCenterId === wcId)
        .filter(o => o.id !== editingId)
        .some(o => rangesOverlapInclusive(startIso, endIso, o.startDate, o.endDate));
  
      return conflicts ? { overlap: true } : null;
    };
  }

  private formatStruct(s: NgbDateStruct | null): string {
    if (!s) return '';
    const mm = String(s.month).padStart(2, '0');
    const dd = String(s.day).padStart(2, '0');
    const yyyy = String(s.year);
    return `${mm}/${dd}/${yyyy}`;
  }
  
  get startDisplay(): string {
    return this.formatStruct(this.form.controls.startDate.value);
  }
  
  get endDisplay(): string {
    return this.formatStruct(this.form.controls.endDate.value);
  }
  
  onStartPicked(date: NgbDateStruct) {
    this.form.controls.startDate.setValue(date);
    this.form.controls.startDate.markAsTouched();
    // re-run form-level validators (end-after-start, overlap)
    this.form.updateValueAndValidity();
  }
  
  onEndPicked(date: NgbDateStruct) {
    this.form.controls.endDate.setValue(date);
    this.form.controls.endDate.markAsTouched();
    this.form.updateValueAndValidity();
  }  
  

  ngOnChanges(): void {
    if (this.mode === 'edit' && this.initial) {
      this.workCenterId = this.initial.workCenterId;
  
      this.form.setValue({
        name: this.initial.name,
        status: this.initial.status,
        startDate: isoToStruct(this.initial.startDate),
        endDate: isoToStruct(this.initial.endDate),
      });
    } else {
      const startIso = this.prefillStartDateIso ?? new Date().toISOString().slice(0, 10);
      const endIso = this.addDaysIso(startIso, 7);
  
      this.form.reset({
        name: '',
        status: 'open',
        startDate: isoToStruct(startIso),
        endDate: isoToStruct(endIso),
      });
    }
  
    this.buildValidators();
    console.log('prefillStartDateIso:', this.prefillStartDateIso, 'mode:', this.mode);

  }  

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const start = this.form.controls.startDate.value!;
    const end = this.form.controls.endDate.value!;

    const wcId = this.workCenterId ?? this.initial?.workCenterId;
    if (!wcId) {
      this.form.setErrors({ missingWorkCenter: true });
      return;
    }

    const payload: WorkOrder = {
      id: this.initial?.id ?? crypto.randomUUID(),
      name: this.form.controls.name.value,
      status: this.form.controls.status.value,
      workCenterId: wcId,
      startDate: structToIso(start),
      endDate: structToIso(end),
    };

    this.submitForm.emit(payload);
  }
}
