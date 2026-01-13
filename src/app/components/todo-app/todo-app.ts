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

  // Computed filtered and sorted list
  filteredList = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.sortedList();
    return term ? list.filter((item) => item.todoItem.toLowerCase().includes(term)) : list;
  });

  sortedList = computed(() => {
    const list = [...this.todoList()];
    if (this.sortOption() === 'priority') return list.sort((a, b) => b.priority - a.priority);
    if (this.sortOption() === 'status') return list.sort((a, b) => b.status - a.status);
    if (this.sortOption() === 'name')
      return list.sort((a, b) => a.todoItem.localeCompare(b.todoItem));
    return list.sort((a, b) => dayjs(b.createDate).valueOf() - dayjs(a.createDate).valueOf());
  });

  totalTasks = computed(() => this.todoList().length);
  pendingTasks = computed(() => this.todoList().filter((t) => t.status === Status.pending).length);
  inProgressTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.inProgress).length
  );
  completedTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.completed).length
  );

  ngOnInit() {
    // Load todos from backend (already mapped inside loadTodos)
    this.todoService.loadTodos();

    // Optionally restore sort option from localStorage
    const sortOptionLocal = localStorage.getItem('sortOption');
    if (sortOptionLocal) this.sortOption.set(JSON.parse(sortOptionLocal));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Create new todo
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

  onCheckTask(taskId: string) {
    const task = this.todoList().find((t) => t.todoItemId === taskId);
    if (!task) return;
    const newStatus = task.status === Status.completed ? Status.inProgress : Status.completed;
    this.todoService.updateTodo(taskId, { status: newStatus }).subscribe();
  }

  onEditTask(taskId: string) {
    const task = this.todoList().find((t) => t.todoItemId === taskId);
    if (task) {
      this.editingTaskId = taskId;
      this.editingTaskCopy = { ...task, createDate: dayjs(task.createDate).toDate() };
      this.editingDateString = dayjs(task.createDate).format('YYYY-MM-DD');
    }
  }

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

  onCancelEdit() {
    this.editingTaskId = null;
    this.editingTaskCopy = null;
    this.editingDateString = '';
  }

  onDeleteTask(taskId: string) {
    this.todoService.deleteTodo(taskId).subscribe();
  }
}
