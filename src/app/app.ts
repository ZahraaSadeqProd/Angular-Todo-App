import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TodoApp } from './components/todo-app/todo-app';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TodoApp],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('todoApp');
}
