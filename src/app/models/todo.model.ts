// Enums for Priority and Status
export enum Priority {
  none,
  lowPriority = 1,
  mediumPriority,
  highPriority 
}

export enum Status {
  none,
  pending = 1,
  inProgress,
  completed 
}

// Model for a Todo Item
export class TodoItemModel {
  todoItemId?: string; // _id from backend
  todoItem: string;
  createDate: Date;
  priority: Priority;
  status: Status;
  isNew?: boolean;

  constructor() {
    this.todoItem = '';
    this.createDate = new Date();
    this.priority = Priority.none;
    this.status = Status.none;
    this.isNew = false;
  }
}
