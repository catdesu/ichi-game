import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseNicknameComponent } from './choose-nickname.component';

describe('ChooseNicknameComponent', () => {
  let component: ChooseNicknameComponent;
  let fixture: ComponentFixture<ChooseNicknameComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChooseNicknameComponent]
    });
    fixture = TestBed.createComponent(ChooseNicknameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
