import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { AnalysisResult } from '../../shared/models/models';

type UploadStep = 'select' | 'column' | 'analyzing' | 'done';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <main class="page">
      <div class="page-header">
        <h1 class="page-title">New Analysis</h1>
        <p class="page-sub">Upload a CSV file and let AI do the heavy lifting.</p>
      </div>

      <!-- Step indicator -->
      <div class="steps-bar">
        <div class="step-item" [class.active]="step() === 'select'" [class.done]="stepNum() > 1">
          <div class="step-circle">
            <span *ngIf="stepNum() <= 1">1</span>
            <svg *ngIf="stepNum() > 1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span>Upload CSV</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" [class.active]="step() === 'column'" [class.done]="stepNum() > 2">
          <div class="step-circle">
            <span *ngIf="stepNum() <= 2">2</span>
            <svg *ngIf="stepNum() > 2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span>Select Column</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" [class.active]="step() === 'analyzing' || step() === 'done'">
          <div class="step-circle">3</div>
          <span>Analyse</span>
        </div>
      </div>

      <!-- Step 1: File drop zone -->
      <div class="card" *ngIf="step() === 'select'">
        <div
          class="drop-zone"
          [class.drag-over]="dragging()"
          (dragover)="$event.preventDefault(); dragging.set(true)"
          (dragleave)="dragging.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input #fileInput type="file" accept=".csv" hidden (change)="onFileChange($event)" />
          <div class="drop-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="drop-title">Drop your CSV here</p>
          <p class="drop-sub">or click to browse · Max 50 MB</p>
        </div>

        <div class="file-preview" *ngIf="selectedFile()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="file-name">{{ selectedFile()!.name }}</span>
          <span class="file-size">{{ formatBytes(selectedFile()!.size) }}</span>
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <button class="primary-btn" [disabled]="!selectedFile() || loadingColumns()" (click)="loadColumns()">
          <span *ngIf="!loadingColumns()">Continue →</span>
          <span *ngIf="loadingColumns()" class="spinner"></span>
        </button>
      </div>

      <!-- Step 2: Column selection -->
      <div class="card" *ngIf="step() === 'column'">
        <h2 class="card-title">Select Feedback Column</h2>
        <p class="card-sub">Choose the column that contains the student feedback text.</p>

        <div class="column-grid">
          <div
            class="column-option"
            *ngFor="let col of columns()"
            [class.selected]="selectedColumn() === col"
            (click)="selectedColumn.set(col)"
          >
            <div class="col-radio"></div>
            <span>{{ col }}</span>
          </div>
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <div class="btn-row">
          <button class="secondary-btn" (click)="step.set('select')">← Back</button>
          <button class="primary-btn" [disabled]="!selectedColumn() || analyzing()" (click)="runAnalysis()">
            <span *ngIf="!analyzing()">Run Analysis</span>
            <span *ngIf="analyzing()" class="spinner"></span>
          </button>
        </div>
      </div>

      <!-- Step 3: Analyzing -->
      <div class="card center-card" *ngIf="step() === 'analyzing'">
        <div class="pulse-ring">
          <div class="pulse-inner">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#E8FF47"/>
              <path d="M12 36L24 12L36 36H28L24 28L20 36H12Z" fill="#0A0A0A"/>
            </svg>
          </div>
        </div>
        <h2 class="analyzing-title">Analysing feedback…</h2>
        <p class="analyzing-sub">Running sentiment models, extracting keywords, and generating LLM summary. This may take up to 60 seconds for large files.</p>
        <div class="progress-steps">
          <div class="progress-step" *ngFor="let s of progressSteps; let i = index" [class.active]="progressIdx() >= i">
            <span class="ps-dot"></span>{{ s }}
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; min-height: 100vh; background: #F3F4F6; font-family: 'DM Sans', sans-serif; }
    .page { max-width: 760px; margin: 0 auto; padding: 2.5rem 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #0A0A0A; margin: 0 0 0.4rem; }
    .page-sub { color: #6B7280; margin: 0; }

    /* Steps bar */
    .steps-bar { display: flex; align-items: center; margin-bottom: 2rem; }
    .step-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #9CA3AF; }
    .step-item.active { color: #0A0A0A; font-weight: 500; }
    .step-item.done { color: #10B981; }
    .step-circle {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid #D1D5DB;
      display: flex; align-items: center; justify-content: center; font-size: 0.78rem;
      font-family: 'Syne', sans-serif; font-weight: 700; color: #9CA3AF; flex-shrink: 0;
    }
    .step-item.active .step-circle { border-color: #0A0A0A; color: #0A0A0A; }
    .step-item.done .step-circle { border-color: #10B981; background: #10B981; color: #fff; }
    .step-line { flex: 1; height: 1px; background: #E5E7EB; margin: 0 0.75rem; }

    /* Card */
    .card { background: #fff; border-radius: 16px; padding: 2rem; border: 1px solid #E5E7EB; }
    .center-card { text-align: center; }
    .card-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: #0A0A0A; margin: 0 0 0.4rem; }
    .card-sub { color: #6B7280; font-size: 0.9rem; margin: 0 0 1.75rem; }

    /* Drop zone */
    .drop-zone {
      border: 2px dashed #D1D5DB; border-radius: 12px; padding: 3rem 2rem;
      text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 1.25rem;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #0A0A0A; background: #F9FAFB; }
    .drop-icon { margin-bottom: 1rem; }
    .drop-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; color: #374151; margin: 0 0 0.4rem; }
    .drop-sub { color: #9CA3AF; font-size: 0.85rem; margin: 0; }

    /* File preview */
    .file-preview { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: #F0FDF4; border-radius: 8px; margin-bottom: 1.25rem; }
    .file-name { font-size: 0.88rem; color: #065F46; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { font-size: 0.78rem; color: #6B7280; flex-shrink: 0; }

    /* Column grid */
    .column-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.75rem; max-height: 320px; overflow-y: auto; }
    .column-option {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
      border: 1.5px solid #E5E7EB; border-radius: 8px; cursor: pointer;
      font-size: 0.88rem; color: #374151; transition: border-color 0.2s, background 0.2s;
    }
    .column-option:hover { border-color: #0A0A0A; }
    .column-option.selected { border-color: #0A0A0A; background: #0A0A0A; color: #E8FF47; }
    .col-radio {
      width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; flex-shrink: 0;
      transition: background 0.15s;
    }
    .column-option.selected .col-radio { background: #E8FF47; border-color: #E8FF47; }

    /* Buttons */
    .btn-row { display: flex; gap: 1rem; }
    .primary-btn {
      flex: 1; padding: 0.85rem; background: #0A0A0A; color: #E8FF47; border: none; border-radius: 8px;
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;
    }
    .primary-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .primary-btn:not(:disabled):hover { opacity: 0.85; }
    .secondary-btn {
      padding: 0.85rem 1.5rem; background: transparent; border: 1.5px solid #E5E7EB; border-radius: 8px;
      font-family: 'DM Sans', sans-serif; font-size: 0.95rem; cursor: pointer; color: #374151;
      transition: border-color 0.2s;
    }
    .secondary-btn:hover { border-color: #9CA3AF; }

    .spinner { width: 20px; height: 20px; border: 2px solid rgba(232,255,71,0.3); border-top-color: #E8FF47; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-box { background: #FEE2E2; color: #DC2626; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.88rem; margin-bottom: 1.25rem; }

    /* Analyzing state */
    .pulse-ring {
      width: 80px; height: 80px; border-radius: 50%; background: rgba(232,255,71,0.15);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    .pulse-inner { width: 56px; height: 56px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; }
    @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.8; } }
    .analyzing-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 700; color: #0A0A0A; margin: 0 0 0.75rem; }
    .analyzing-sub { color: #6B7280; font-size: 0.9rem; max-width: 440px; margin: 0 auto 2rem; line-height: 1.6; }
    .progress-steps { text-align: left; display: inline-flex; flex-direction: column; gap: 0.75rem; }
    .progress-step { display: flex; align-items: center; gap: 0.6rem; color: #9CA3AF; font-size: 0.88rem; transition: color 0.4s; }
    .progress-step.active { color: #0A0A0A; font-weight: 500; }
    .ps-dot { width: 8px; height: 8px; border-radius: 50%; background: #D1D5DB; flex-shrink: 0; transition: background 0.4s; }
    .progress-step.active .ps-dot { background: #10B981; }
  `],
})
export class UploadComponent {
  private feedbackSvc = inject(FeedbackService);
  private router = inject(Router);

  step = signal<UploadStep>('select');
  dragging = signal(false);
  selectedFile = signal<File | null>(null);
  columns = signal<string[]>([]);
  selectedColumn = signal('');
  loadingColumns = signal(false);
  analyzing = signal(false);
  error = signal('');
  progressIdx = signal(0);

  progressSteps = [
    'Parsing CSV and cleaning text…',
    'Running RoBERTa sentiment model…',
    'Extracting keywords with KeyBERT…',
    'Generating summary with LLaMA 3.1…',
  ];

  get stepNum(): () => number {
    return () => {
      const map: Record<UploadStep, number> = { select: 1, column: 2, analyzing: 3, done: 4 };
      return map[this.step()];
    };
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile.set(file);
      this.error.set('');
    } else {
      this.error.set('Please drop a valid .csv file.');
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.selectedFile.set(file); this.error.set(''); }
  }

  loadColumns(): void {
    if (!this.selectedFile()) return;
    this.loadingColumns.set(true);
    this.error.set('');
    this.feedbackSvc.getColumns(this.selectedFile()!).subscribe({
      next: cols => {
        this.columns.set(cols);
        this.loadingColumns.set(false);
        this.step.set('column');
      },
      error: err => {
        this.error.set(err.error?.error ?? 'Failed to read CSV columns.');
        this.loadingColumns.set(false);
      },
    });
  }

  runAnalysis(): void {
    if (!this.selectedFile() || !this.selectedColumn()) return;
    this.analyzing.set(true);
    this.step.set('analyzing');

    // Simulate progress ticks while waiting for the backend
    let idx = 0;
    const ticker = setInterval(() => {
      if (idx < this.progressSteps.length - 1) this.progressIdx.set(++idx);
      else clearInterval(ticker);
    }, 8000);

    this.feedbackSvc.analyze(this.selectedFile()!, this.selectedColumn()).subscribe({
      next: (result: AnalysisResult) => {
        clearInterval(ticker);
        this.progressIdx.set(this.progressSteps.length);
        this.router.navigate(['/results', result.id], { state: { result } });
      },
      error: err => {
        clearInterval(ticker);
        this.analyzing.set(false);
        this.step.set('column');
        this.error.set(err.error?.error ?? 'Analysis failed. Please try again.');
      },
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
