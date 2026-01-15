import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export enum Priority {
  none,
  lowPriority = 1,
  mediumPriority,
  highPriority,
}

export enum Status {
  none,
  pending = 1,
  inProgress,
  completed,
}

export interface Todo {
  _id: string; // MongoDB ID
  todoItem: string;
  createDate: string; // backend returns string
  priority: number; // enum number
  status: number; // enum number
  isNew?: boolean;
  user?: string;
  todoItemId?: string; // frontend alias for _id
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly API = 'https://to-do-app-backend-giun.onrender.com/todos';

  todos = signal<Todo[]>([]);

  constructor(private http: HttpClient) {}

  // Load all todos
  loadTodos() {
    this.http.get<Todo[]>(this.API).subscribe((todos) => {
      // Map _id to todoItemId and convert createDate to Date
      const mapped = todos.map((t) => ({
        ...t,
        todoItemId: t._id, // use MongoDB _id as unique ID
        createDate: new Date(t.createDate).toISOString(), // convert backend string to Date
      }));
      this.todos.set(mapped);
    });
  }

  // Create a new todo
  createTodo(todo: Partial<Todo>) {
    return this.http.post<Todo>(this.API, todo).pipe(
      tap((t) => {
        this.todos.update((list) => [...list, { ...t, todoItemId: t._id }]);
      })
    );
  }

  // Update a todo by id
  updateTodo(id: string, updates: Partial<Todo>) {
    return this.http.put<Todo>(`${this.API}/${id}`, updates).pipe(
      tap((updated) => {
        this.todos.update((list) => {
          const index = list.findIndex((t) => t.todoItemId === id);
          if (index !== -1) {
            const newList = [...list];
            newList[index] = { ...updated, todoItemId: updated._id };
            return newList;
          }
          return list;
        });
      })
    );
  }

  // Delete a todo by id
  deleteTodo(id: string) {
    return this.http.delete(`${this.API}/${id}`).pipe(
      tap(() => {
        this.todos.update((list) => list.filter((t) => t.todoItemId !== id));
      })
    );
  }
}
