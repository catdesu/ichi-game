import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorDialogComponent } from './color-dialog.component';

describe('ColorDialogComponent', () => {
  let component: ColorDialogComponent;
  let fixture: ComponentFixture<ColorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ColorDialogComponent]
    });
    fixture = TestBed.createComponent(ColorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
