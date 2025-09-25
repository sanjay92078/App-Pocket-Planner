import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone:true
})
export class RegisterComponent {
 registrationForm: FormGroup;
  registrationError: string = '';



 constructor(private fb: FormBuilder, private router: Router) {
    this.registrationForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

   onSubmit() {
    if (this.registrationForm.valid) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const emailExists = users.some((u: any) => u.email === this.registrationForm.value.email);
      if (emailExists) {
        this.registrationError = 'Email already registered';
        return;
      }
      users.push(this.registrationForm.value);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registration successful. Please login.');
      this.router.navigate(['/login']);
    } else {
      this.registrationError = 'Please fill all required fields correctly.';
    }
  }
}
