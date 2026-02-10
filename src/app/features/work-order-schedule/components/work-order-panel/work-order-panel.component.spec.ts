import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkOrderPanelComponent } from './work-order-panel.component';

describe('WorkOrderPanelComponent', () => {
  let component: WorkOrderPanelComponent;
  let fixture: ComponentFixture<WorkOrderPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrderPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkOrderPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
