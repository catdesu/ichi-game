import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengeDialogComponent } from './challenge-dialog.component';

describe('ChallengeDialogComponent', () => {
  let component: ChallengeDialogComponent;
  let fixture: ComponentFixture<ChallengeDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChallengeDialogComponent]
    });
    fixture = TestBed.createComponent(ChallengeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
