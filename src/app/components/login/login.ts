import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None,
})
export class Login {
  private router = inject(Router); 

  email = signal('');
  password = signal('');
  error = signal('');
  isLoading = signal(false);

  constructor(private auth: AuthService) {}

  login() {
    this.error.set('');

    if (!this.email() || !this.password()) {
      this.error.set('Please fill all fields.');
      return;
    }

    this.isLoading.set(true);
    this.auth.login(this.email(), this.password()).subscribe({
      next: (res) => {
        console.log('LOGIN SUCCESS', res);
        this.auth.setSession(res);
        this.router.navigate(['/todos']); 
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
        if (err.status === 401) {
          this.error.set(err.error?.message || 'Invalid email or password.');
        } else if (err.status === 400) {
          this.error.set(err.error?.message || 'Invalid email or password.');
        } else if (err.status === 500) {
          this.error.set('Server error. Please try again later.');
        } else {
          this.error.set(err.error?.message || 'Login failed. Please try again.');
        }
      },
    });
  }

  loginDemo() {
    this.error.set('');
    this.isLoading.set(true);
    this.auth.demoLogin().subscribe({
      next: (res) => {
        console.log('DEMO LOGIN SUCCESS', res);
        this.auth.setSession(res);
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
        this.error.set(err.error?.message || 'Demo login failed. Please try again.');
      },
    });
  }

  // Navigate to registration page
  goRegister() {
    this.router.navigate(['/register']);
  }
}
