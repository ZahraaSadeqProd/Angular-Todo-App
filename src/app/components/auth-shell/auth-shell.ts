import { Component, ViewEncapsulation } from '@angular/core';
import { Login } from '../login/login';
import { Register } from '../register/register';

/**
 * Auth Shell Component
 * Container component for authentication pages (login and register).
 * Provides a shared layout and routing between login and register components.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [Login, Register],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
  encapsulation: ViewEncapsulation.None,
})
export class AuthShell {

}
