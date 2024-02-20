import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthTabMenuComponent } from './auth-tab-menu.component';

describe('AuthTabMenuComponent', () => {
  let component: AuthTabMenuComponent;
  let fixture: ComponentFixture<AuthTabMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuthTabMenuComponent]
    });
    fixture = TestBed.createComponent(AuthTabMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
