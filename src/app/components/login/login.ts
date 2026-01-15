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
  private router = inject(Router); // <-- inject router

  email = signal('');
  password = signal('');
  error = signal('');

  constructor(private auth: AuthService) {}

  login() {
    this.auth.login(this.email(), this.password()).subscribe({
      next: (res) => {
        console.log('LOGIN SUCCESS', res);
        this.auth.setSession(res);
        this.router.navigate(['/todos']); // <-- redirect here
      },
      error: (err) => {
        console.error(err);
        this.error.set('Invalid email or password');
      },
    });
  }

  loginDemo() {
    this.auth.demoLogin().subscribe({
      next: (res) => {
        console.log('DEMO LOGIN SUCCESS', res);
        this.auth.setSession(res);
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Demo login failed');
      },
    });
  }

  // Navigate to registration page
  goRegister() {
    this.router.navigate(['/register']);
  }
}
