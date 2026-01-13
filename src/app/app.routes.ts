import { Routes } from '@angular/router';
import { TodoApp } from './components/todo-app/todo-app';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Protected routes
  { path: 'todos', component: TodoApp, canActivate: [AuthGuard] },

  // Wildcard route
  { path: '**', redirectTo: 'login' },
];
