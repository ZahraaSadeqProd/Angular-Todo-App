import { Routes } from '@angular/router';
import { TodoApp } from './components/todo-app/todo-app';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AuthShell } from './components/auth-shell/auth-shell';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth-shell', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth-shell', component: AuthShell },

  // Protected routes
  { path: 'todos', component: TodoApp, canActivate: [AuthGuard] },

  // Wildcard route
  { path: '**', redirectTo: 'auth-shell' },
];
