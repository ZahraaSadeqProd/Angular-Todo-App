import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Login Component
 * Handles user authentication with email/password or demo login.
 * Features:
 * - Email and password validation
 * - Error handling with user-friendly messages
 * - Loading state during authentication
 * - Demo login for testing purposes
 * - Navigation to registration page
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None,
})
export class Login {
  private router = inject(Router); 

  // Form input signals
  email = signal('');
  password = signal('');
  
  // UI state signals
  error = signal('');
  isLoading = signal(false);

  constructor(private auth: AuthService) {}

  /**
   * Authenticates user with email and password.
   * - Validates email and password fields are not empty
   * - Sets loading state during authentication
   * - Establishes session on success
   * - Navigates to todos page on success
   * - Handles various error scenarios with appropriate messages
   */
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

  /**
   * Authenticates user with demo credentials.
   * Creates or retrieves a unique demo user session for testing purposes.
   * - Sets loading state during authentication
   * - Establishes session on success
   * - Navigates to todos page on success
   * - Handles errors with user-friendly message
   */
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

  /**
   * Navigates user to the registration page.
   */
  goRegister() {
    this.router.navigate(['/register']);
  }
}
