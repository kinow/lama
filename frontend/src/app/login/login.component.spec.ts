import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { FormBuilder } from '@angular/forms';
import { InputCheckService } from '../input-check.service';

describe('LoginComponent', () => {
  /* Test environment setup */
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      // Added the dependencies InputCheckService, FormBuilder
      providers: [InputCheckService, FormBuilder]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* Test cases */
  // Checks whether the component gets created
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Checks default value of errorMsg is empty string
  it('Checks default value of errorMsg is empty string', () => {
    expect(component.errorMsg).toBe("");
  });

  // Checks whether loginSubmit function provides error
  // When called with unmodified forms
  it('Checks the loginSubmit function using no form input', () => {
    component.loginSubmit();
    expect(component.errorMsg).toBe("Username or password not filled in");
  });

  // Checks the loginSubmit function using dummy form input 
  // (username: testusername and password: testpassword)
  it('Checks the loginSubmit function using dummy form input', () => {
    // initializes the loginForm
    component.loginForm.value.username = "testusername";
    component.loginForm.value.password = "testpassword";

    component.loginSubmit();
    expect(component.errorMsg).toBe("");
  });

});
