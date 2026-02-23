import { Component } from '@angular/core';
import { FeedbackFormComponent } from './feedback-form/feedback-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FeedbackFormComponent],
  templateUrl: './app.html'
})
export class AppComponent {}