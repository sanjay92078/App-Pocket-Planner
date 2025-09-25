import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  loginError: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(
        (u: any) =>
          u.email === this.loginForm.value.email && u.password === this.loginForm.value.password
      );
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userId', user.id || user.email);
        this.router.navigate(['/home']);
      } else {
        this.loginError = 'Invalid email or password';
      }
    } else {
      this.loginError = '*Please enter valid credentials';
    }
  }
}
