import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-form.html'
})
export class FeedbackFormComponent {

  selectedFile: File | null = null;

  columns = signal<string[]>([]);
  selectedColumn = signal<string>('');

  overallSentiment = signal<string>('');
  sentimentDistribution = signal<any>({});
  keywords = signal<string[]>([]);
  summary = signal<string>('');

  isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // Handle CSV file upload
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }

    this.selectedFile = file;

    const formData = new FormData();
    formData.append('file', file);

    // Call backend to extract column names
    this.http.post<any>(
      'http://localhost:8080/api/feedback/columns',
      formData
    ).subscribe(res => {
      this.columns.set(res.columns || []);
      this.selectedColumn.set('');
      this.cdr.markForCheck();
    });
  }

  // Handle column selection (strict mode safe)
  onColumnChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedColumn.set(selectElement.value);
  }

  // Trigger analysis
  analyze() {

    if (!this.selectedColumn()) {
      alert('Please select a column.');
      return;
    }

    this.isLoading.set(true);

    this.http.post<any>(
      'http://localhost:8080/api/feedback/batch',
      { columnName: this.selectedColumn() }
    ).subscribe({
      next: (res) => {
        this.overallSentiment.set(res.overall_sentiment);
        this.sentimentDistribution.set(res.sentiment_distribution || {});
        this.keywords.set(res.top_keywords || []);
        this.summary.set(res.summary || '');
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