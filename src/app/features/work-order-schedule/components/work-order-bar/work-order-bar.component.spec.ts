import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkOrderBarComponent } from './work-order-bar.component';

describe('WorkOrderBarComponent', () => {
  let component: WorkOrderBarComponent;
  let fixture: ComponentFixture<WorkOrderBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrderBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkOrderBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
