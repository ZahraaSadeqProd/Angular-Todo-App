import { NgClass } from '@angular/common';
import { Pipe, PipeTransform, OnInit, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Model for a Todo Item
class TodoItemModel {
  todoItem : string;
  createDate : Date;
  priority: Priority;
  status : Status;
  todoItemId: number;
  isNew?: boolean;

  constructor() {
    this.todoItem = '';
    this.createDate = new Date();
    this.priority = Priority.none;
    this.status = Status.none;
    this.todoItemId = 0;
    this.isNew = false;
  }
}

// Enums for Priority and Status
export enum Priority {
  none,
  LowPriority = 1,
  MediumPriority,
  HighPriority 
}

export enum Status {
  none,
  Pending = 1,
  InProgress,
  Completed 
}

// Pipes for displaying Priority and Status labels
@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: Priority): string {
    const labels = {
      [Priority.none]: 'None',
      [Priority.LowPriority]: 'Low Priority',
      [Priority.MediumPriority]: 'Medium Priority',
      [Priority.HighPriority]: 'High Priority'
    };
    return labels[value] || 'Unknown';
  }
}

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: Status): string {
    const labels = {
      [Status.none]: 'None',
      [Status.Pending]: 'Pending',
      [Status.InProgress]: 'In Progress',
      [Status.Completed]: 'Completed'
    };
    return labels[value] || 'Unknown';
  }
}

// Main TodoApp Component
@Component({
  selector: 'app-todo-app',
  imports: [FormsModule, NgClass, CommonModule, PriorityLabelPipe, StatusLabelPipe],
  templateUrl: './todo-app.html',
  styleUrl: './todo-app.css',
})
export class TodoApp implements OnInit{
  // Expose enum to template
  Status = Status; 
  Priority = Priority; 

  // Variables for new task entry and localStorage key
  newTask: TodoItemModel = new TodoItemModel();
  localKeyName: string = 'todoItems';
  searchTerm: string = '';
  sortOption: string = 'date';

  // Variables for editing tasks
  editingTaskId: number | null = null;
  editingTaskCopy: TodoItemModel | null = null;
  
  // Signals for reactive state management
  todoList = signal<TodoItemModel[]>([]);
  filteredList = signal<TodoItemModel[]>([]);
  
  // Lifecycle hook to load data from localStorage on initialization
  ngOnInit() {
    const localData = localStorage.getItem(this.localKeyName);
    if (localData) {
      const parsed = JSON.parse(localData);
      // Convert date strings back to Date objects and reset isNew flag
      const tasks = parsed.map((task: any) => ({
        ...task,
        createDate: new Date(task.createDate),
        isNew: false // Reset animation flag on load
      }));
      this.todoList.set(tasks);
    }

    const sortOptionLocalData = localStorage.getItem('sortOption');
    if (sortOptionLocalData) {
      this.sortOption = JSON.parse(sortOptionLocalData);
    }

    // Apply sorting on initial load
    this.applySorting();
    // Initialize filtered list
    this.filteredList.set(this.todoList());
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
      this.newTask.priority = Priority.LowPriority;
    }

    // Set default status if not selected
    if (this.newTask.status === Status.none) {
      this.newTask.status = Status.Pending;
    }
    
    // Create a copy of newTask to avoid all items referencing the same object
    const taskToAdd = { ...this.newTask, isNew: true };
    this.todoList.update(list => [taskToAdd, ...list]);
    
    // Persist to localStorage
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));

    // Reset newTask for the next entry
    this.newTask = new TodoItemModel();

    // Re-apply current sorting
    this.applySorting();
    
    // Update filtered list
    this.applySearch();

    // Remove isNew flag after animation completes
    setTimeout(() => {
      const updatedList = this.todoList().map(item => 
        item.todoItemId === taskToAdd.todoItemId ? { ...item, isNew: false } : item
      );
      this.todoList.set(updatedList);
    }, 2000);
  }

  onCheckTask(taskId: number) {
    const updatedList = this.todoList().map(item => {
      if (item.todoItemId === taskId) {
        // Toggle between Completed and In Progress
        const newStatus = item.status === Status.Completed ? Status.InProgress : Status.Completed;
        return { ...item, status: newStatus };
      }
      return item;
    });

    this.todoList.set(updatedList);
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
    this.applySearch();
  }

  onEditTask(taskId: number) {
    // Find the task and create a copy for editing
    const task = this.todoList().find(item => item.todoItemId === taskId);
    if (task) {
      this.editingTaskId = taskId;
      this.editingTaskCopy = { ...task };
    }
  }

  onSaveEdit() {
    if (this.editingTaskCopy && this.editingTaskId !== null) {
      const updatedList = this.todoList().map(item => {
        if (item.todoItemId === this.editingTaskId) {
          return this.editingTaskCopy!;
        }
        return item;
      });

      this.todoList.set(updatedList);
      localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
      this.editingTaskId = null;
      this.editingTaskCopy = null;
      this.applySearch();
    }
  }

  onSearchChange() {
    this.applySearch();
  }

  applySearch() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      // If search is empty, show all tasks
      this.filteredList.set(this.todoList());
    } else {
      // Filter tasks by search term
      const filtered = this.todoList().filter(item => 
        item.todoItem.toLowerCase().includes(term)
      );
      this.filteredList.set(filtered);
    }
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortOption = selectElement.value;
    localStorage.setItem('sortOption', JSON.stringify(this.sortOption));
    this.applySorting();
    this.applySearch();
  }

  applySorting() {
    let sortedList = [...this.todoList()];

    if (this.sortOption === 'priority') {
      // Sort by priority: High to Low
      sortedList.sort((a, b) => b.priority - a.priority);
    } else if (this.sortOption === 'status') {
      // Sort by status: Completed, In Progress, Pending
      sortedList.sort((a, b) => b.status - a.status);
    } else if (this.sortOption === 'name') {
      // Sort by name alphabetically
      sortedList.sort((a, b) => a.todoItem.localeCompare(b.todoItem));
    } else {
      // Sort by date: newest first
      sortedList.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
    }

    this.todoList.set(sortedList);
  }

  onCancelEdit() {
    this.editingTaskId = null;
    this.editingTaskCopy = null;
  }

  onDeleteTask(taskId: number) {
    const updatedList = this.todoList().filter(item => item.todoItemId !== taskId);
    this.todoList.set(updatedList);
    localStorage.setItem(this.localKeyName, JSON.stringify(this.todoList()));
    this.applySearch();
  }
  
  generateNewId() {
    const newDate = new Date();
    this.newTask.todoItemId = this.todoList().length + 1 + newDate.getDay() + newDate.getMilliseconds();
  }

  getTotalTasksCount() : number {
    return this.todoList().length;
  }

  getPendingTasksCount() : number {
    return this.todoList().filter(item => item.status === Status.Pending).length;
  }

  getCompletedTasksCount() : number {
    return this.todoList().filter(item => item.status === Status.Completed).length;
  }

  getInProgressTasksCount() : number {
    return this.todoList().filter(item => item.status === Status.InProgress).length;
  }
}