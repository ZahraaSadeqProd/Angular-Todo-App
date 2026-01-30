import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Response interface for authentication endpoints.
 * Contains the authentication token and user information.
 */
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    isDemo: boolean;
  };
}

/**
 * Authentication Service
 * Manages user authentication, session state, and token management.
 * - Handles login/logout operations
 * - Maintains user session in signals and localStorage
 * - Provides computed properties for auth state
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // Signals for reactive state management
  /** Current authentication token signal */
  token = signal<string | null>(localStorage.getItem('token'));
  /** Current logged-in user signal */
  user = signal<any | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  // Computed properties derived from signals
  /** Computed property to check if user is logged in */
  isLoggedIn = computed(() => !!this.token());
  /** Computed property to check if current user is a demo user */
  isDemo = computed(() => !!this.user()?.isDemo);

  constructor(private http: HttpClient) {}

  /**
   * Authenticates user with email and password.
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Observable<LoginResponse>} Observable containing token and user data
   */
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, { email, password });
  }

  /**
   * Creates or retrieves a demo user session.
   * Useful for allowing users to test the app without registration.
   * @returns {Observable<LoginResponse>} Observable containing demo token and user data
   */
  demoLogin() {
    return this.http.post<LoginResponse>(`${this.API}/auth/demo`, {});
  }

  /**
   * Establishes user session after successful authentication.
   * Saves token and user data to signals and localStorage.
   * @param {LoginResponse} data - Authentication response with token and user info
   */
  setSession(data: LoginResponse) {
    this.token.set(data.token);
    this.user.set(data.user);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Clears user authentication and session data.
   * Removes token and user from signals and localStorage.
   */
  logout() {
    this.token.set(null);
    this.user.set(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Sets authentication token and optionally user data.
   * Useful for establishing sessions after registration or token refresh.
   * @param {string} token - Authentication JWT token
   * @param {any} [user] - Optional user information object
   */
  setToken(token: string, user?: any) {
    this.token.set(token);
    if (user) this.user.set(user);

    localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }
}
