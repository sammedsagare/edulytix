import { Component } from '@angular/core';
import { FeedbackFormComponent } from './feedback-form/feedback-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FeedbackFormComponent],
  template: `<app-feedback-form></app-feedback-form>`
})
export class App {}
