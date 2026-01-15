import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  encapsulation: ViewEncapsulation.None,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMsg = signal('');
  isLoading = signal(false);

  private readonly API = 'https://to-do-app-backend-giun.onrender.com/auth/register';

  register() {
    this.errorMsg.set('');

    // Basic validation
    if (!this.email() || !this.password()) {
      this.errorMsg.set('Please fill all fields.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMsg.set('Passwords do not match.');
      return;
    }

    // Set loading state
    this.isLoading.set(true);

    // Call backend
    this.http
      .post<{ user: any; token: string }>(this.API, {
        email: this.email(),
        password: this.password(),
      })
      .subscribe({
        next: (res) => {
          // Set token and user in AuthService
          this.auth.setToken(res.token, res.user);

          // Redirect to todo app
          this.router.navigate(['/todos']);
        },
        error: (err) => {
          this.isLoading.set(false);
          // Handle different error scenarios
          if (err.status === 400) {
            this.errorMsg.set(err.error?.message || 'Invalid email or password.');
          } else if (err.status === 409) {
            this.errorMsg.set(err.error?.message || 'Email already registered.');
          } else if (err.status === 500) {
            this.errorMsg.set('Server error. Please try again later.');
          } else {
            this.errorMsg.set(err.error?.message || 'Registration failed. Please try again.');
          }
        },
      });
  }
}
