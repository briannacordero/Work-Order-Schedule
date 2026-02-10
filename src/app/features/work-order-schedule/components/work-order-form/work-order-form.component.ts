import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { WorkOrder, WorkOrderStatus } from '../../../../models/work-order.model';
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
  @Input() initial?: WorkOrder; // when editing
  @Output() cancel = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<WorkOrder>();

  statusOptions: { label: string; value: WorkOrderStatus }[] = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Complete', value: 'complete' },
    { label: 'Blocked', value: 'blocked' },
  ];

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<WorkOrderStatus>('open', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
    endDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
  });

  ngOnChanges(): void {
    if (this.mode === 'edit' && this.initial) {
      this.form.setValue({
        name: this.initial.name,
        status: this.initial.status,
        startDate: isoToStruct(this.initial.startDate),
        endDate: isoToStruct(this.initial.endDate),
      });
    } else {
      // Create defaults (we’ll later prefill from click position)
      const today = new Date();
      const startIso = today.toISOString().slice(0, 10);

      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      const endIso = end.toISOString().slice(0, 10);

      this.form.reset({
        name: '',
        status: 'open',
        startDate: isoToStruct(startIso),
        endDate: isoToStruct(endIso),
      });
    }
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

    const payload: WorkOrder = {
      id: this.initial?.id ?? crypto.randomUUID(),
      name: this.form.controls.name.value,
      status: this.form.controls.status.value,
      workCenterId: this.initial?.workCenterId ?? 'wc-1', // temp; we’ll pass this in next phase
      startDate: structToIso(start),
      endDate: structToIso(end),
    };

    this.submitForm.emit(payload);
  }
}
