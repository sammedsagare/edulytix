import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { AnalysisResult } from '../../shared/models/models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, DecimalPipe],
  template: `
    <app-navbar />

    <main class="page">
      <!-- Loading -->
      <div class="loading-shell" *ngIf="loading()">
        <div class="spinner-lg"></div>
        <p>Loading results…</p>
      </div>

      <ng-container *ngIf="!loading() && result()">
        <!-- Header -->
        <div class="result-header">
          <div>
            <div class="breadcrumb">
              <a routerLink="/history">History</a>
              <span>/</span>
              <span>{{ result()!.fileName }}</span>
            </div>
            <h1 class="page-title">Analysis Results</h1>
            <p class="page-meta">
              {{ result()!.rowCount | number }} rows · Column: <strong>{{ result()!.selectedColumn }}</strong>
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
              <span class="bar-pct">{{ entry.value }}%</span>
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
                [style.font-size.rem]="1.05 - i * 0.03"
                [style.opacity]="1 - i * 0.04"
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
      <div class="error-box" *ngIf="!loading() && !result()">
        <p>Could not load results. <a routerLink="/history">Return to history</a></p>
      </div>
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; min-height: 100vh; background: #F3F4F6; font-family: 'DM Sans', sans-serif; }
    .page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* Loading */
    .loading-shell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 1rem; color: #6B7280; }
    .spinner-lg { width: 40px; height: 40px; border: 3px solid #E5E7EB; border-top-color: #0A0A0A; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Header */
    .result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #9CA3AF; margin-bottom: 0.4rem; }
    .breadcrumb a { color: #6B7280; text-decoration: none; }
    .breadcrumb a:hover { color: #0A0A0A; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #0A0A0A; margin: 0 0 0.4rem; }
    .page-meta { color: #6B7280; font-size: 0.88rem; margin: 0; }
    .page-meta strong { color: #374151; }
    .new-btn {
      display: inline-flex; align-items: center; padding: 0.65rem 1.25rem;
      background: #0A0A0A; color: #E8FF47; border-radius: 8px; text-decoration: none;
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.88rem;
      white-space: nowrap; transition: opacity 0.2s;
    }
    .new-btn:hover { opacity: 0.85; }

    /* Hero card */
    .sentiment-hero {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
      gap: 2rem; padding: 2rem 2.5rem; border-radius: 16px; margin-bottom: 1.75rem;
      border: 1px solid transparent;
    }
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

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .info-card { background: #fff; border-radius: 14px; padding: 1.5rem; border: 1px solid #E5E7EB; }
    .info-card.full-width { grid-column: 1 / -1; }
    .card-title {
      font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #0A0A0A;
      margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .card-icon { font-size: 1.1rem; }
    .model-tag {
      margin-left: auto; font-size: 0.68rem; padding: 0.2rem 0.5rem; background: #F3F4F6;
      border-radius: 4px; color: #6B7280; font-family: 'DM Sans', sans-serif; font-weight: 400;
    }

    /* Keywords */
    .keyword-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .keyword-chip {
      display: inline-block; padding: 0.35rem 0.85rem; background: #0A0A0A; color: #E8FF47;
      border-radius: 999px; font-size: 0.88rem; font-weight: 500;
    }

    /* Insight lists */
    .insight-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .insight-item { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.9rem; color: #374151; line-height: 1.5; }
    .insight-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 0.38rem; }
    .strength .insight-dot { background: #10B981; }
    .improvement .insight-dot { background: #F59E0B; }
    .empty-insight { font-size: 0.85rem; color: #9CA3AF; font-style: italic; }

    /* Summary */
    .summary-text { color: #374151; line-height: 1.8; font-size: 0.95rem; white-space: pre-line; margin: 0; }

    /* Error */
    .error-box { text-align: center; padding: 3rem; color: #6B7280; }
    .error-box a { color: #4F46E5; }

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

  loading = signal(true);
  result = signal<AnalysisResult | null>(null);

  ngOnInit() {
    // Try to get result from router state (fast path from upload)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { result?: AnalysisResult } | undefined;
    if (state?.result) {
      this.result.set(state.result);
      this.loading.set(false);
      return;
    }

    // Fallback: load from history by id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.feedbackSvc.getHistory().subscribe({
      next: list => {
        const found = list.find(a => a.id === id) ?? null;
        this.result.set(found);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

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
}
