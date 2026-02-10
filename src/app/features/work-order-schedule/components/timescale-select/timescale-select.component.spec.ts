import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimescaleSelectComponent } from './timescale-select.component';

describe('TimescaleSelectComponent', () => {
  let component: TimescaleSelectComponent;
  let fixture: ComponentFixture<TimescaleSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimescaleSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimescaleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
