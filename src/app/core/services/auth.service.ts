import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    isDemo: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'https://to-do-app-backend-giun.onrender.com';

  // Signals
  token = signal<string | null>(localStorage.getItem('token'));
  user = signal<any | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  // Computed
  isLoggedIn = computed(() => !!this.token());
  isDemo = computed(() => !!this.user()?.isDemo);

  constructor(private http: HttpClient) {}

  // Login
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, { email, password });
  }

  // Demo login - creates unique demo user
  demoLogin() {
    return this.http.post<LoginResponse>(`${this.API}/auth/demo`, {});
  }

  // Registration / session setup
  setSession(data: LoginResponse) {
    this.token.set(data.token);
    this.user.set(data.user);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  // Logout
  logout() {
    this.token.set(null);
    this.user.set(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Optional helper to set token directly (e.g., after registration)
  setToken(token: string, user?: any) {
    this.token.set(token);
    if (user) this.user.set(user);

    localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }
}
