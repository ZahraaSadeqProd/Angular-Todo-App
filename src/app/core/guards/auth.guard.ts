import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  private auth = inject(AuthService);

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      return true; // user is logged in, allow access
    }

    // not logged in → redirect to login
    this.router.navigate(['/login']);
    return false;
  }
}
