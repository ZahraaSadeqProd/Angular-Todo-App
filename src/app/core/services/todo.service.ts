import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Priority levels for todo items.
 * Values: 1 (low), 2 (medium), 3 (high)
 */
export enum Priority {
  none,
  lowPriority = 1,
  mediumPriority,
  highPriority,
}

/**
 * Status levels for todo items.
 * Values: 1 (pending), 2 (in progress), 3 (completed)
 */
export enum Status {
  none,
  pending = 1,
  inProgress,
  completed,
}

/**
 * Todo item data model.
 * Represents a single task in the todo application.
 */
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

/**
 * Todo Service
 * Manages all todo-related operations:
 * - Loading todos from backend
 * - Creating new todos
 * - Updating existing todos
 * - Deleting todos
 * Maintains reactive state using Angular signals
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly API = `${environment.apiUrl}/todos`;

  /** Signal containing current list of todos */
  todos = signal<Todo[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Loads all todos from the backend.
   * - Fetches todos from API
   * - Maps _id to todoItemId for consistent frontend usage
   * - Converts createDate string to ISO string format
   * - Updates the todos signal with mapped data
   */
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

  /**
   * Creates a new todo item.
   * @param {Partial<Todo>} todo - Todo data (todoItem, priority, status, createDate)
   * @returns {Observable<Todo>} Observable with the created todo
   * Updates todos signal optimistically after successful creation
   */
  createTodo(todo: Partial<Todo>) {
    return this.http.post<Todo>(this.API, todo).pipe(
      tap((t) => {
        this.todos.update((list) => [...list, { ...t, todoItemId: t._id }]);
      })
    );
  }

  /**
   * Updates an existing todo item by ID.
   * @param {string} id - The todoItemId of the todo to update
   * @param {Partial<Todo>} updates - Fields to update (todoItem, priority, status, etc.)
   * @returns {Observable<Todo>} Observable with the updated todo
   * Updates todos signal optimistically after successful update
   */
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

  /**
   * Deletes a todo item by ID.
   * @param {string} id - The todoItemId of the todo to delete
   * @returns {Observable<void>} Observable for the delete operation
   * Updates todos signal optimistically by removing the deleted item
   */
  deleteTodo(id: string) {
    return this.http.delete(`${this.API}/${id}`).pipe(
      tap(() => {
        this.todos.update((list) => list.filter((t) => t.todoItemId !== id));
      })
    );
  }
}
