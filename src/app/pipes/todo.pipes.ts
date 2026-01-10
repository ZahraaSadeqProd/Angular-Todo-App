import { Pipe, PipeTransform } from '@angular/core';
import { Priority, Status } from '../models/todo.model';

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: Priority): string {
    const labels = {
      [Priority.none]: 'None',
      [Priority.lowPriority]: 'Low Priority',
      [Priority.mediumPriority]: 'Medium Priority',
      [Priority.highPriority]: 'High Priority'
    };
    return labels[value] || 'Unknown';
  }
}

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: Status): string {
    const labels = {
      [Status.none]: 'None',
      [Status.pending]: 'Pending',
      [Status.inProgress]: 'In Progress',
      [Status.completed]: 'Completed'
    };
    return labels[value] || 'Unknown';
  }
}
