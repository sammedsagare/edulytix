import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="min-h-screen bg-black flex items-center justify-center px-4">
    <div class="w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl p-8">

      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white tracking-wide">
          Edulytix
        </h1>
        <p class="text-neutral-400 mt-2 text-lg">
          AI-powered student feedback analysis
        </p>
      </div>

      <!-- Textarea -->
      <div class="mb-6">
        <label class="block text-neutral-300 mb-2 text-sm">
          Student Feedback
        </label>
        <textarea
          class="w-full min-h-[140px] rounded-xl bg-neutral-800 text-white placeholder-neutral-500 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          [(ngModel)]="feedbackText"
          placeholder="Type student feedback here..."
        ></textarea>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-center">
        <button
          type="button"
          class="px-8 py-3 rounded-xl font-semibold transition-all duration-300
                 bg-emerald-500 text-black
                 hover:bg-emerald-400 hover:scale-105
                 disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="isLoading()"
          (click)="submitFeedback()">
          {{ isLoading() ? 'Analyzing...' : 'Analyze Feedback' }}
        </button>
      </div>

      <!-- Result -->
      @if (sentiment()) {
        <div
          class="mt-8 rounded-xl border p-6 transition-all"
          [ngClass]="{
            'border-emerald-500 bg-emerald-500/10': sentiment() === 'Positive',
            'border-red-500 bg-red-500/10': sentiment() === 'Negative',
            'border-yellow-500 bg-yellow-500/10': sentiment() === 'Neutral'
          }"
        >
          <p class="text-white text-lg mb-3">
            <span class="font-semibold">Sentiment:</span>
            <span
              class="ml-2 font-bold"
              [ngClass]="{
                'text-emerald-400': sentiment() === 'Positive',
                'text-red-400': sentiment() === 'Negative',
                'text-yellow-400': sentiment() === 'Neutral'
              }"
            >
              {{ sentiment() }}
            </span>
          </p>

          <div>
            <p class="text-neutral-300 mb-2 font-medium">Keywords</p>
            <div class="flex flex-wrap gap-2">
              @for (word of keywords(); track word) {
                <span
                  class="px-3 py-1 rounded-full text-sm
                         bg-neutral-800 text-neutral-200
                         border border-neutral-700"
                >
                  {{ word }}
                </span>
              }
            </div>
          </div>
        </div>
      }

    </div>
  </div>
`

})
export class FeedbackFormComponent {
  feedbackText = '';
  sentiment = signal<string>('');
  keywords = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef // 🔑 The fix
  ) {}

  submitFeedback() {
    if (!this.feedbackText.trim()) return;

    this.isLoading.set(true);
    
    this.http.post<any>(
      'http://localhost:8080/api/feedback',
      { text: this.feedbackText }
    ).subscribe({
      next: (res) => {
        this.sentiment.set(res.sentiment);
        this.keywords.set(res.keywords || []);
        this.isLoading.set(false);
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
}