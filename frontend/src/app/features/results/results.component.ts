import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { AnalysisResult } from '../../shared/models/models';

type ReRunStep = 'select' | 'column' | 'analyzing';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />

    <main class="page">
      <!-- Loading -->
      <div class="loading-shell" *ngIf="loading()">
        <div class="spinner-lg"></div>
        <p>Loading results…</p>
      </div>

      <ng-container *ngIf="!loading() && result()">
        
        <!-- Re-run Prompt Banner -->
        <div class="run-again-banner" *ngIf="!isReRunning()">
          <p>Do you want to add more data to this analysis?</p>
          <button class="primary-btn sm-btn" (click)="isReRunning.set(true)">Yes, run again</button>
        </div>

        <!-- Inline Re-run Flow -->
        <div class="card run-again-card" *ngIf="isReRunning()">
          <div class="card-header-flex">
            <h2 class="card-title">Add New Data</h2>
            <button class="circle-btn" (click)="cancelReRun()">✕</button>
          </div>

          <!-- Step 1: Select File -->
          <div *ngIf="reRunStep() === 'select'">
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p class="drop-title">Drop new CSV here</p>
              <p class="drop-sub">Max 50 MB</p>
            </div>

            <div class="file-preview" *ngIf="selectedFile()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span class="file-name">{{ selectedFile()!.name }}</span>
            </div>

            <div class="error-box" *ngIf="reRunError()">{{ reRunError() }}</div>

            <button class="primary-btn" [disabled]="!selectedFile() || loadingColumns()" (click)="loadColumns()">
              <span *ngIf="!loadingColumns()">Continue →</span>
              <span *ngIf="loadingColumns()" class="spinner"></span>
            </button>
          </div>

          <!-- Step 2: Select Column -->
          <div *ngIf="reRunStep() === 'column'">
            <p class="card-sub">Select the feedback column for the new file.</p>
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
            <div class="error-box" *ngIf="reRunError()">{{ reRunError() }}</div>
            <div class="btn-row">
              <button class="secondary-btn" (click)="reRunStep.set('select')">Back</button>
              <button class="primary-btn" [disabled]="!selectedColumn() || analyzing()" (click)="runMergeAnalysis()">
                <span *ngIf="!analyzing()">Merge Data</span>
                <span *ngIf="analyzing()" class="spinner"></span>
              </button>
            </div>
          </div>

          <!-- Step 3: Analyzing -->
          <div *ngIf="reRunStep() === 'analyzing'" class="center-card py-6">
            <div class="spinner-lg mx-auto mb-4"></div>
            <h3 class="analyzing-title">Analysing and Merging…</h3>
            <p class="analyzing-sub">Combining previous insights with new data.</p>
          </div>
        </div>

        <!-- Comparison Highlight Banner -->
        <div class="comparison-banner" *ngIf="comparison()">
          <div class="comp-title"><span class="card-icon">⚡</span> Comparison Insights (New Data Added)</div>
          <ul class="comp-list">
            <li><strong>+{{ comparison()!.rowCountDiff | number }}</strong> new rows processed.</li>
            <li *ngIf="comparison()!.sentimentShift">
              Sentiment shift: 
              <span class="shift-val">{{ comparison()!.sentimentShift }}</span>
            </li>
            <li *ngIf="comparison()!.newKeywords.length">
              New topics discovered: 
              <span *ngFor="let nk of comparison()!.newKeywords" class="new-kw">{{ nk }}</span>
            </li>
          </ul>
        </div>

        <!-- Header -->
        <div class="result-header">
          <div>
            <div class="breadcrumb">
              <a routerLink="/history">History</a>
              <span>/</span>
              <span>{{ result()!.fileName }} <span *ngIf="isMerged()" class="merged-badge">Merged</span></span>
            </div>
            <h1 class="page-title">Analysis Results</h1>
            <p class="page-meta">
              {{ result()!.rowCount | number }} rows total
              · {{ result()!.createdAt | date:'MMM d, y · h:mm a' }}
            </p>
          </div>
          <a routerLink="/upload" class="new-btn">+ New Analysis</a>
        </div>

        <!-- Overall sentiment hero card -->
        <div class="sentiment-hero" [class]="heroClass()">
          <div class="hero-left">
            <span class="hero-label">Overall Sentiment</span>
            <span class="hero-value">{{ result()!.overallSentiment }}</span>
            <span class="hero-emoji">{{ sentimentEmoji() }}</span>
          </div>
          <div class="hero-bars" *ngIf="result()!.sentimentDistribution">
            <div class="bar-row" *ngFor="let entry of distributionEntries()">
              <span class="bar-label">{{ entry.key }}</span>
              <div class="bar-track">
                <div class="bar-fill" [class]="'fill-' + entry.key.toLowerCase()" [style.width.%]="entry.value"></div>
              </div>
              <span class="bar-pct">{{ (entry.value | number:'1.0-1') }}%</span>
            </div>
          </div>
        </div>

        <!-- 3-col grid -->
        <div class="info-grid">
          <!-- Keywords -->
          <div class="info-card full-width">
            <h2 class="card-title">
              <span class="card-icon">🔑</span> Top Keywords
            </h2>
            <div class="keyword-cloud">
              <span
                class="keyword-chip"
                *ngFor="let kw of result()!.keywords; let i = index"
                [style.font-size.rem]="1.05 - Math.min(i, 15) * 0.02"
                [style.opacity]="1 - Math.min(i, 15) * 0.03"
              >{{ kw }}</span>
            </div>
          </div>

          <!-- Strengths -->
          <div class="info-card">
            <h2 class="card-title">
              <span class="card-icon">💪</span> Strengths
            </h2>
            <ul class="insight-list">
              <li *ngFor="let s of result()!.strengths" class="insight-item strength">
                <span class="insight-dot"></span>{{ s }}
              </li>
              <li *ngIf="!result()!.strengths?.length" class="empty-insight">No strengths detected</li>
            </ul>
          </div>

          <!-- Improvement areas -->
          <div class="info-card">
            <h2 class="card-title">
              <span class="card-icon">🎯</span> Areas for Improvement
            </h2>
            <ul class="insight-list">
              <li *ngFor="let a of result()!.improvementAreas" class="insight-item improvement">
                <span class="insight-dot"></span>{{ a }}
              </li>
              <li *ngIf="!result()!.improvementAreas?.length" class="empty-insight">No areas flagged</li>
            </ul>
          </div>

          <!-- Summary -->
          <div class="info-card full-width">
            <h2 class="card-title">
              <span class="card-icon">🤖</span> AI-Generated Summary
              <span class="model-tag">LLaMA 3.1</span>
            </h2>
            <p class="summary-text">{{ result()!.summary }}</p>
          </div>
        </div>
      </ng-container>

      <!-- Error -->
      <div class="error-box mt-4" *ngIf="!loading() && !result()">
        <p>Could not load results. <a routerLink="/history">Return to history</a></p>
      </div>
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; min-height: 100vh; background: #F3F4F6; font-family: 'DM Sans', sans-serif; }
    .page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* Utilities */
    .mt-4 { margin-top: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
    .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }

    /* Loading */
    .loading-shell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 1rem; color: #6B7280; }
    .spinner-lg { width: 40px; height: 40px; border: 3px solid #E5E7EB; border-top-color: #0A0A0A; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(232,255,71,0.3); border-top-color: #E8FF47; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Re-run Flow */
    .run-again-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: #E8FF47; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 2rem;
      color: #0A0A0A; font-weight: 500; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .run-again-banner p { margin: 0; }
    .sm-btn { padding: 0.5rem 1rem !important; font-size: 0.85rem !important; }
    
    .run-again-card { margin-bottom: 2rem; background: #fff; padding: 1.5rem 2rem; border-radius: 14px; border: 2px dashed #D1D5DB; }
    .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .circle-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: #F3F4F6; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: background 0.2s; }
    .circle-btn:hover { background: #E5E7EB; color: #0A0A0A; }

    /* Drop zone (copied from upload.component) */
    .drop-zone { border: 2px dashed #D1D5DB; border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 1.25rem; }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #0A0A0A; background: #F9FAFB; }
    .drop-icon { margin-bottom: 0.75rem; }
    .drop-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; color: #374151; margin: 0 0 0.25rem; }
    .drop-sub { color: #9CA3AF; font-size: 0.8rem; margin: 0; }
    .file-preview { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: #F0FDF4; border-radius: 8px; margin-bottom: 1.25rem; }
    .file-name { font-size: 0.88rem; color: #065F46; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .column-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin-bottom: 1.5rem; max-height: 250px; overflow-y: auto; }
    .column-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1.5px solid #E5E7EB; border-radius: 8px; cursor: pointer; font-size: 0.88rem; color: #374151; transition: border-color 0.2s, background 0.2s; }
    .column-option:hover { border-color: #0A0A0A; }
    .column-option.selected { border-color: #0A0A0A; background: #0A0A0A; color: #E8FF47; }
    .col-radio { width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; flex-shrink: 0; transition: background 0.15s; }
    .column-option.selected .col-radio { background: #E8FF47; border-color: #E8FF47; }

    .btn-row { display: flex; gap: 1rem; }
    .primary-btn { flex: 1; padding: 0.85rem; background: #0A0A0A; color: #E8FF47; border: none; border-radius: 8px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
    .primary-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .primary-btn:not(:disabled):hover { opacity: 0.85; }
    .secondary-btn { padding: 0.85rem 1.5rem; background: transparent; border: 1.5px solid #E5E7EB; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; cursor: pointer; color: #374151; transition: border-color 0.2s; }
    .secondary-btn:hover { border-color: #9CA3AF; }

    /* Comparison Banner */
    .comparison-banner {
      background: #F8FAFC; border-left: 4px solid #3B82F6; padding: 1.25rem 1.5rem;
      border-radius: 0 12px 12px 0; margin-bottom: 2rem;
    }
    .comp-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; color: #1E293B; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
    .comp-list { margin: 0; padding-left: 1.5rem; color: #475569; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .shift-val { font-weight: 600; color: #0A0A0A; }
    .new-kw { display: inline-block; background: #DBEAFE; color: #1D4ED8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem; margin-right: 0.4rem; font-weight: 500; }
    
    .merged-badge { background: #3B82F6; color: white; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-left: 0.5rem; text-transform: uppercase; }

    /* Original Header / Content */
    .result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #9CA3AF; margin-bottom: 0.4rem; }
    .breadcrumb a { color: #6B7280; text-decoration: none; }
    .breadcrumb a:hover { color: #0A0A0A; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #0A0A0A; margin: 0 0 0.4rem; }
    .page-meta { color: #6B7280; font-size: 0.88rem; margin: 0; }
    .new-btn { display: inline-flex; align-items: center; padding: 0.65rem 1.25rem; background: #0A0A0A; color: #E8FF47; border-radius: 8px; text-decoration: none; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.88rem; white-space: nowrap; transition: opacity 0.2s; }
    .new-btn:hover { opacity: 0.85; }

    .sentiment-hero { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; padding: 2rem 2.5rem; border-radius: 16px; margin-bottom: 1.75rem; border: 1px solid transparent; }
    .hero-positive { background: #F0FDF4; border-color: #BBF7D0; }
    .hero-negative { background: #FFF5F5; border-color: #FED7D7; }
    .hero-neutral  { background: #F9FAFB; border-color: #E5E7EB; }
    .hero-left { display: flex; flex-direction: column; }
    .hero-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; color: #6B7280; margin-bottom: 0.25rem; }
    .hero-value { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; color: #0A0A0A; line-height: 1; }
    .hero-emoji { font-size: 2rem; margin-top: 0.25rem; }
    .hero-bars { flex: 1; max-width: 380px; display: flex; flex-direction: column; gap: 0.6rem; }
    .bar-row { display: flex; align-items: center; gap: 0.75rem; }
    .bar-label { width: 64px; font-size: 0.8rem; color: #6B7280; text-align: right; }
    .bar-track { flex: 1; height: 10px; background: #E5E7EB; border-radius: 5px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
    .fill-positive { background: #10B981; }
    .fill-negative { background: #EF4444; }
    .fill-neutral  { background: #9CA3AF; }
    .bar-pct { width: 40px; font-size: 0.8rem; color: #374151; font-weight: 500; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .info-card { background: #fff; border-radius: 14px; padding: 1.5rem; border: 1px solid #E5E7EB; }
    .info-card.full-width { grid-column: 1 / -1; }
    .card-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #0A0A0A; margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .card-icon { font-size: 1.1rem; }
    .model-tag { margin-left: auto; font-size: 0.68rem; padding: 0.2rem 0.5rem; background: #F3F4F6; border-radius: 4px; color: #6B7280; font-family: 'DM Sans', sans-serif; font-weight: 400; }

    .keyword-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .keyword-chip { display: inline-block; padding: 0.35rem 0.85rem; background: #0A0A0A; color: #E8FF47; border-radius: 999px; font-size: 0.88rem; font-weight: 500; }

    .insight-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .insight-item { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.9rem; color: #374151; line-height: 1.5; }
    .insight-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 0.38rem; }
    .strength .insight-dot { background: #10B981; }
    .improvement .insight-dot { background: #F59E0B; }
    .empty-insight { font-size: 0.85rem; color: #9CA3AF; font-style: italic; }

    .summary-text { color: #374151; line-height: 1.8; font-size: 0.95rem; white-space: pre-line; margin: 0; }
    
    .error-box { background: #FEE2E2; color: #DC2626; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; font-size: 0.9rem; }
    .error-box a { color: #DC2626; text-decoration: underline; }

    @media (max-width: 640px) {
      .info-grid { grid-template-columns: 1fr; }
      .hero-bars { max-width: 100%; }
      .sentiment-hero { flex-direction: column; }
    }
  `],
})
export class ResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private feedbackSvc = inject(FeedbackService);
  
  Math = Math; // for template

  loading = signal(true);
  result = signal<AnalysisResult | null>(null);

  // States for Re-Run Feature
  isReRunning = signal(false);
  isMerged = signal(false);
  reRunStep = signal<ReRunStep>('select');
  dragging = signal(false);
  selectedFile = signal<File | null>(null);
  columns = signal<string[]>([]);
  selectedColumn = signal('');
  loadingColumns = signal(false);
  analyzing = signal(false);
  reRunError = signal('');

  comparison = signal<{
    rowCountDiff: number;
    sentimentShift: string;
    newKeywords: string[];
  } | null>(null);

  ngOnInit() {
    // Try to get result from router state (fast path from upload)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { result?: AnalysisResult } | undefined;
    if (state?.result) {
      this.result.set({...state.result}); // clone to prevent mutating historical object if present
      this.loading.set(false);
      return;
    }

    // Fallback: load from history by id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.feedbackSvc.getHistory().subscribe({
      next: list => {
        const found = list.find(a => a.id === id) ?? null;
        if (found) {
            this.result.set({...found}); // clone
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ==== Display Helpers ====
  heroClass(): string {
    const s = (this.result()?.overallSentiment ?? 'Neutral').toLowerCase();
    return `sentiment-hero hero-${s}`;
  }

  sentimentEmoji(): string {
    const map: Record<string, string> = { Positive: '😊', Negative: '😟', Neutral: '😐' };
    return map[this.result()?.overallSentiment ?? 'Neutral'] ?? '😐';
  }

  distributionEntries(): { key: string; value: number }[] {
    const dist = this.result()?.sentimentDistribution ?? {};
    return Object.entries(dist).map(([key, value]) => ({ key, value: Number(value) }));
  }

  // ==== Re-Run Flow Logic ====
  cancelReRun(): void {
    this.isReRunning.set(false);
    this.reRunStep.set('select');
    this.selectedFile.set(null);
    this.reRunError.set('');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile.set(file);
      this.reRunError.set('');
    } else {
      this.reRunError.set('Please drop a valid .csv file.');
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.selectedFile.set(file); this.reRunError.set(''); }
  }

  loadColumns(): void {
    if (!this.selectedFile()) return;
    this.loadingColumns.set(true);
    this.reRunError.set('');
    this.feedbackSvc.getColumns(this.selectedFile()!).subscribe({
      next: cols => {
        this.columns.set(cols);
        this.loadingColumns.set(false);
        this.reRunStep.set('column');
        
        // Auto-select if a column matches our current result's selected column
        const currentCol = this.result()?.selectedColumn;
        if (currentCol && cols.includes(currentCol)) {
            this.selectedColumn.set(currentCol);
        } else {
            this.selectedColumn.set('');
        }
      },
      error: err => {
        this.reRunError.set(err.error?.error ?? 'Failed to read CSV columns.');
        this.loadingColumns.set(false);
      },
    });
  }

  runMergeAnalysis(): void {
    if (!this.selectedFile() || !this.selectedColumn()) return;
    this.analyzing.set(true);
    this.reRunStep.set('analyzing');

    this.feedbackSvc.analyze(this.selectedFile()!, this.selectedColumn()).subscribe({
      next: (newResult: AnalysisResult) => {
        this.analyzing.set(false);
        this.isReRunning.set(false);
        this.mergeAndCompare(newResult);
      },
      error: err => {
        this.analyzing.set(false);
        this.reRunStep.set('column');
        this.reRunError.set(err.error?.error ?? 'Analysis failed. Please try again.');
      },
    });
  }

  private mergeAndCompare(newResult: AnalysisResult): void {
    const oldResult = this.result();
    if (!oldResult) return;

    // 1. Calculate Comparison Insights
    const oldDist = oldResult.sentimentDistribution || {};
    const newDist = newResult.sentimentDistribution || {};
    
    // Check shift by looking at Positive shift
    const oldPos = Number(oldDist['Positive'] || 0);
    const newPos = Number(newDist['Positive'] || 0);
    let shiftMsg = 'No significant shift';
    if (newPos > oldPos + 5) shiftMsg = `Positive sentiment went up from ${oldPos.toFixed(1)}% to ${newPos.toFixed(1)}%`;
    else if (newPos < oldPos - 5) shiftMsg = `Positive sentiment dropped from ${oldPos.toFixed(1)}% to ${newPos.toFixed(1)}%`;
    else {
        // Check negative shift
        const oldNeg = Number(oldDist['Negative'] || 0);
        const newNeg = Number(newDist['Negative'] || 0);
        if (newNeg > oldNeg + 5) shiftMsg = `Negative sentiment increased from ${oldNeg.toFixed(1)}% to ${newNeg.toFixed(1)}%`;
        else if (newNeg < oldNeg - 5) shiftMsg = `Negative sentiment decreased from ${oldNeg.toFixed(1)}% to ${newNeg.toFixed(1)}%`;
    }

    const oldKwSet = new Set(oldResult.keywords || []);
    const completelyNewKw = (newResult.keywords || []).filter(kw => !oldKwSet.has(kw));

    this.comparison.set({
      rowCountDiff: newResult.rowCount,
      sentimentShift: shiftMsg,
      newKeywords: completelyNewKw.slice(0, 5) // top 5 new keywords
    });

    // 2. Perform The Merge
    const totalRows = oldResult.rowCount + newResult.rowCount;
    
    // Merge distribution via weighted average
    const mergedDist: Record<string, number> = {};
    for (const key of ['Positive', 'Negative', 'Neutral']) {
      const oldVal = Number(oldDist[key] || 0) * oldResult.rowCount;
      const newVal = Number(newDist[key] || 0) * newResult.rowCount;
      mergedDist[key] = (oldVal + newVal) / totalRows;
    }

    // Determine new overall sentiment based on the new max percentage
    let newOverall: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
    let max = -1;
    for (const [k, v] of Object.entries(mergedDist)) {
      if (v > max) { max = v; newOverall = k as any; }
    }

    // Deduplicate lists
    const mergedKeywords = Array.from(new Set([...oldResult.keywords, ...newResult.keywords]));
    const mergedStrengths = Array.from(new Set([...oldResult.strengths, ...newResult.strengths]));
    const mergedAreas = Array.from(new Set([...oldResult.improvementAreas, ...newResult.improvementAreas]));

    // Combine summaries
    let mergedSummary = oldResult.summary;
    if (newResult.summary && newResult.summary !== oldResult.summary) {
        mergedSummary += '\\n\\n--- [New Insights Added] ---\\n\\n' + newResult.summary;
    }

    const mergedObj: AnalysisResult = {
        ...oldResult,
        rowCount: totalRows,
        sentimentDistribution: mergedDist,
        overallSentiment: newOverall,
        keywords: mergedKeywords,
        strengths: mergedStrengths,
        improvementAreas: mergedAreas,
        summary: mergedSummary
    };

    // Update state
    this.result.set(mergedObj);
    this.isMerged.set(true);
    
    // Reset wizard
    this.reRunStep.set('select');
    this.selectedFile.set(null);
  }
}
