import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
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
    this.auth.login('demo@todoapp.com', 'demo1234').subscribe({
      next: (res) => {
        console.log('DEMO LOGIN SUCCESS', res);
        this.auth.setSession(res);
        this.router.navigate(['/todos']); // <-- redirect here
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
