import { NgClass, CommonModule } from '@angular/common';
import { OnInit, Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoItemModel, Priority, Status } from '../../models/todo.model';
import { PriorityLabelPipe, StatusLabelPipe } from '../../pipes/todo.pipes';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { TodoService, Todo } from '../../core/services/todo.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-todo-app',
  imports: [FormsModule, NgClass, CommonModule, PriorityLabelPipe, StatusLabelPipe],
  templateUrl: './todo-app.html',
  styleUrl: './todo-app.css',
})
export class TodoApp implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  todoService = inject(TodoService);

  // Expose enums to template
  Status = Status;
  Priority = Priority;

  // Signals
  todoList = this.todoService.todos;
  searchTerm = signal('');
  sortOption = signal('date');

  // Editing state
  editingTaskId: string | null = null;
  editingTaskCopy: TodoItemModel | null = null;
  editingDateString: string = '';

  // New task
  newTask: TodoItemModel = new TodoItemModel();
  newTaskDateString: string = '';

    /**
   * Filters the todo list based on the search term.
   * @returns {TodoItemModel[]} The filtered list of todo items.
   */
  filteredList = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.sortedList();
    return term ? list.filter((item) => item.todoItem.toLowerCase().includes(term)) : list;
  });

  /**
   * Sorts the todo list based on the selected sort option.
   * @returns {TodoItemModel[]} The sorted list of todo items.
   */
  sortedList = computed(() => {
    const list = [...this.todoList()];
    if (this.sortOption() === 'priority') return list.sort((a, b) => b.priority - a.priority);
    if (this.sortOption() === 'status') return list.sort((a, b) => b.status - a.status);
    if (this.sortOption() === 'name')
      return list.sort((a, b) => a.todoItem.localeCompare(b.todoItem));
    return list.sort((a, b) => dayjs(b.createDate).valueOf() - dayjs(a.createDate).valueOf());
  });

  /**
   * Computes the total number of tasks in the todo list.
   * @returns {number} The total number of tasks.
   */
  totalTasks = computed(() => this.todoList().length);
  /**
   * Computes the number of pending tasks in the todo list.
   * @returns {number} The number of pending tasks.
   */
  pendingTasks = computed(() => this.todoList().filter((t) => t.status === Status.pending).length);
  /**
   * Computes the number of tasks currently in progress.
   * @returns {number} The number of tasks in progress.
   */
  inProgressTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.inProgress).length
  );
  /**
   * Computes the number of completed tasks in the todo list.
   * @returns {number} The number of completed tasks.
   */
  completedTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.completed).length
  );

  /**
   * Angular lifecycle hook called after component initialization.
   * - Loads todos from the backend
   * - Restores sort option from localStorage if available
   */
  ngOnInit() {
    // Load todos from backend (already mapped inside loadTodos)
    this.todoService.loadTodos();

    // Optionally restore sort option from localStorage
    const sortOptionLocal = localStorage.getItem('sortOption');
    if (sortOptionLocal) this.sortOption.set(JSON.parse(sortOptionLocal));
  }

  /**
   * Logs out the user and redirects to the home page.
   * Clears authentication credentials and navigates to root path.
   */
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  /**
   * Creates a new todo task from the form input.
   * - Validates and trims the title
   * - Sets default priority and status if not provided
   * - Converts date string to ISO format (defaults to current date if not provided)
   * - Calls the todo service to save the task
   * - Clears the form after successful creation
   */
  onSaveNewTask() {
    const trimmedTitle = (this.newTask.todoItem || '').trim();
    if (!trimmedTitle) return;

    const todo: Partial<Todo> = {
      todoItem: trimmedTitle,
      priority: this.newTask.priority || Priority.lowPriority,
      status: this.newTask.status || Status.pending,
      createDate: this.newTaskDateString
        ? dayjs(this.newTaskDateString).toISOString()
        : dayjs().toISOString(),
    };

    this.todoService.createTodo(todo).subscribe(() => {
      this.newTask = new TodoItemModel();
      this.newTaskDateString = '';
    });
  }

  /**
   * Toggles the status of a todo task between 'completed' and 'in-progress'.
   * @param {string} taskId - The ID of the task to toggle
   */
  onCheckTask(taskId: string) {
    const task = this.todoList().find((t) => t.todoItemId === taskId);
    if (!task) return;
    const newStatus = task.status === Status.completed ? Status.inProgress : Status.completed;
    this.todoService.updateTodo(taskId, { status: newStatus }).subscribe();
  }

  /**
   * Prepares a task for editing by copying its data.
   * @param {string} taskId - The ID of the task to edit
   * Sets the editingTaskId, creates a copy of the task, and formats the date string
   */
  onEditTask(taskId: string) {
    const task = this.todoList().find((t) => t.todoItemId === taskId);
    if (task) {
      this.editingTaskId = taskId;
      this.editingTaskCopy = { ...task, createDate: dayjs(task.createDate).toDate() };
      this.editingDateString = dayjs(task.createDate).format('YYYY-MM-DD');
    }
  }

  /**
   * Saves the edited task with updated values.
   * - Validates that editing task exists
   * - Converts date string to ISO format
   * - Updates the task via the todo service
   * - Clears the editing state upon successful save
   */
  onSaveEdit() {
    if (!this.editingTaskCopy || !this.editingTaskId) return;
    
    const updates: Partial<Todo> = {
      todoItem: this.editingTaskCopy.todoItem,
      priority: this.editingTaskCopy.priority,
      status: this.editingTaskCopy.status,
      createDate: this.editingDateString
        ? dayjs(this.editingDateString).toISOString()
        : dayjs().toISOString(),
    };
    this.todoService.updateTodo(this.editingTaskId, updates).subscribe(() => {
      this.editingTaskId = null;
      this.editingTaskCopy = null;
      this.editingDateString = '';
    });
  }

  /**
   * Cancels the current edit operation and clears the editing state.
   */
  onCancelEdit() {
    this.editingTaskId = null;
    this.editingTaskCopy = null;
    this.editingDateString = '';
  }

  /**
   * Deletes a todo task by its ID.
   * @param {string} taskId - The ID of the task to delete
   */
  onDeleteTask(taskId: string) {
    this.todoService.deleteTodo(taskId).subscribe();
  }
}
