import { NgClass } from '@angular/common';
import { OnInit, Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TodoItemModel, Priority, Status } from '../../models/todo.model';
import { PriorityLabelPipe, StatusLabelPipe } from '../../pipes/todo.pipes';

// Main TodoApp Component
@Component({
  selector: 'app-todo-app',
  imports: [FormsModule, NgClass, CommonModule, PriorityLabelPipe, StatusLabelPipe],
  templateUrl: './todo-app.html',
  styleUrl: './todo-app.css',
})
export class TodoApp implements OnInit {
  // Expose enum to template
  Status = Status;
  Priority = Priority;

  // Variables for new task entry and localStorage key
  newTask: TodoItemModel = new TodoItemModel();
  localKeyName: string = 'todoItems';
  searchTerm = signal(''); // writable signal

  // Variables for editing tasks
  editingTaskId: number | null = null;
  editingTaskCopy: TodoItemModel | null = null;

  // Signals for reactive state management
  todoList = signal<TodoItemModel[]>([]);
  // Computed signal for filtered list based on search term
  // because filteredList depends on both todoList and searchTerm
  // as well as its a read-only value that we dont want to set directly
  filteredList = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.sortedList();

    // If no search term, return full list
    if (!term) return list;

    // Filter based on search term
    return list.filter((item) => item.todoItem.toLowerCase().includes(term));
  });

  // Computed signals for task statistics
  totalTasks = computed(() => this.todoList().length);
  pendingTasks = computed(() => this.todoList().filter((t) => t.status === Status.pending).length);
  inProgressTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.inProgress).length
  );
  completedTasks = computed(
    () => this.todoList().filter((t) => t.status === Status.completed).length
  );

  // Signal and computed for sorting
  sortOption = signal('date');
  sortedList = computed(() => {
    const list = [...this.todoList()];
    if (this.sortOption() === 'priority') return list.sort((a, b) => b.priority - a.priority);
    if (this.sortOption() === 'status') return list.sort((a, b) => b.status - a.status);
    if (this.sortOption() === 'name')
      return list.sort((a, b) => a.todoItem.localeCompare(b.todoItem));
    return list.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
  });

  // Lifecycle hook to load data from localStorage on initialization
  ngOnInit() {
    const localData = localStorage.getItem(this.localKeyName);
    if (localData) {
      const parsed = JSON.parse(localData);
      // Convert date strings back to Date objects and reset isNew flag
      const tasks = parsed.map((task: any) => ({
        ...task,
        createDate: new Date(task.createDate),
        isNew: false, // Reset animation flag on load
      }));
      this.todoList.set(tasks);
    }

    const sortOptionLocalData = localStorage.getItem('sortOption');
    if (sortOptionLocalData) {
      this.sortOption.set(JSON.parse(sortOptionLocalData));
    }
  }

  onSaveNewTask() {
    this.generateNewId();

    // Require a non-empty title
    const trimmedTitle = (this.newTask.todoItem || '').trim();
    if (!trimmedTitle) {
      return; // Early exit if no title provided
    }
    this.newTask.todoItem = trimmedTitle;

    // Set default priority if not selected
    if (this.newTask.priority === Priority.none) {
      this.newTask.priority = Priority.lowPriority;
    }

    // Set default status if not selected
    if (this.newTask.status === Status.none) {
      this.newTask.status = Status.pending;
    }

    // Create a copy of newTask to avoid all items referencing the same object
    const taskToAdd = { ...this.newTask, isNew: true };
    this.todoList.update((list) => [taskToAdd, ...list]);

    // Persist to localStorage
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));

    // Reset newTask for the next entry
    this.newTask = new TodoItemModel();
  }

  onCheckTask(taskId: number) {
    const updatedList = this.todoList().map((item) => {
      if (item.todoItemId === taskId) {
        // Toggle between Completed and In Progress
        const newStatus = item.status === Status.completed ? Status.inProgress : Status.completed;
        return { ...item, status: newStatus };
      }
      return item;
    });

    this.todoList.set(updatedList);
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
  }

  onEditTask(taskId: number) {
    // Find the task and create a copy for editing
    const task = this.todoList().find((item) => item.todoItemId === taskId);
    if (task) {
      this.editingTaskId = taskId;
      this.editingTaskCopy = { ...task };
    }
  }

  onSaveEdit() {
    if (this.editingTaskCopy && this.editingTaskId !== null) {
      const updatedList = this.todoList().map((item) => {
        if (item.todoItemId === this.editingTaskId) {
          return this.editingTaskCopy!;
        }
        return item;
      });

      this.todoList.set(updatedList);
      localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
      this.editingTaskId = null;
      this.editingTaskCopy = null;
    }
  }

  onCancelEdit() {
    this.editingTaskId = null;
    this.editingTaskCopy = null;
  }

  onDeleteTask(taskId: number) {
    const updatedList = this.todoList().filter((item) => item.todoItemId !== taskId);
    this.todoList.set(updatedList);
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
  }

  generateNewId() {
    const newDate = new Date();
    this.newTask.todoItemId =
      this.todoList().length + 1 + newDate.getDay() + newDate.getMilliseconds();
  }
}
