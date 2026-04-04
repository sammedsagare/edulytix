import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { AuthService } from '../../core/services/auth.service';
import { AnalysisResult } from '../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <main class="page">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-text">
          <h1 class="hero-heading">
            Hello, <span class="accent">{{ firstName() }}</span>
          </h1>
          <p class="hero-sub">
            Your AI feedback analytics hub. Upload a CSV, pick a column, and get insights in seconds.
          </p>
          <a routerLink="/upload" class="cta-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            New Analysis
          </a>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ totalAnalyses() }}</span>
            <span class="stat-label">Total Analyses</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalRows() | number }}</span>
            <span class="stat-label">Rows Processed</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ dominantSentiment() }}</span>
            <span class="stat-label">Most Common Sentiment</span>
          </div>
        </div>
      </section>

      <!-- Recent analyses -->
      <section class="recent-section">
        <div class="section-header">
          <h2 class="section-title">Recent Analyses</h2>
          <a routerLink="/history" class="view-all">View all →</a>
        </div>

        <div *ngIf="loading()" class="loading-grid">
          <div class="skeleton-card" *ngFor="let n of [1,2,3]"></div>
        </div>

        <div *ngIf="!loading() && recent().length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <p>No analyses yet. Upload your first CSV to get started!</p>
          <a routerLink="/upload" class="cta-btn small">Upload CSV</a>
        </div>

        <div class="analysis-grid" *ngIf="!loading() && recent().length > 0">
          <div class="analysis-card" *ngFor="let a of recent()" [routerLink]="['/results', a.id]">
            <div class="card-header">
              <span class="file-name">{{ a.fileName }}</span>
              <span class="sentiment-badge" [class]="sentimentClass(a.overallSentiment)">
                {{ a.overallSentiment }}
              </span>
            </div>
            <div class="card-meta">
              <span>Column: <strong>{{ a.selectedColumn }}</strong></span>
              <span>{{ a.rowCount | number }} rows</span>
            </div>
            <div class="card-bar-row" *ngIf="a.sentimentDistribution">
              <div class="bar-segment pos" [style.width.%]="a.sentimentDistribution['Positive'] || 0"></div>
              <div class="bar-segment neu" [style.width.%]="a.sentimentDistribution['Neutral'] || 0"></div>
              <div class="bar-segment neg" [style.width.%]="a.sentimentDistribution['Negative'] || 0"></div>
            </div>
            <div class="card-date">{{ a.createdAt | date:'MMM d, y · h:mm a' }}</div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; min-height: 100vh; background: #F3F4F6; font-family: 'DM Sans', sans-serif; }
    .page { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* Hero */
    .hero { margin-bottom: 3rem; }
    .hero-heading { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; color: #0A0A0A; margin: 0 0 0.5rem; }
    .accent { color: #4F46E5; }
    .hero-sub { color: #6B7280; font-size: 1rem; margin: 0 0 2rem; max-width: 520px; line-height: 1.6; }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem; background: #0A0A0A; color: #E8FF47;
      border-radius: 8px; text-decoration: none; font-family: 'Syne', sans-serif;
      font-weight: 600; font-size: 0.95rem; transition: opacity 0.2s, transform 0.15s;
    }
    .cta-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .cta-btn.small { font-size: 0.85rem; padding: 0.6rem 1.2rem; margin-top: 1rem; }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-top: 2.5rem; }
    .stat-card { background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #E5E7EB; }
    .stat-value { display: block; font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; color: #0A0A0A; }
    .stat-label { font-size: 0.82rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }

    /* Section */
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .section-title { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; color: #0A0A0A; margin: 0; }
    .view-all { color: #4F46E5; text-decoration: none; font-size: 0.9rem; font-weight: 500; }

    /* Cards */
    .analysis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .analysis-card {
      background: #fff; border-radius: 12px; padding: 1.25rem; border: 1px solid #E5E7EB;
      cursor: pointer; transition: box-shadow 0.2s, transform 0.15s;
    }
    .analysis-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 0.5rem; }
    .file-name { font-weight: 500; font-size: 0.9rem; color: #111827; word-break: break-all; }
    .sentiment-badge {
      font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 999px;
      font-weight: 600; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .badge-positive { background: #D1FAE5; color: #065F46; }
    .badge-negative { background: #FEE2E2; color: #991B1B; }
    .badge-neutral  { background: #E5E7EB; color: #374151; }
    .card-meta { display: flex; justify-content: space-between; font-size: 0.82rem; color: #6B7280; margin-bottom: 0.75rem; }
    .card-bar-row { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem; gap: 1px; }
    .bar-segment { height: 100%; transition: width 0.5s; }
    .pos { background: #10B981; }
    .neu { background: #D1D5DB; }
    .neg { background: #EF4444; }
    .card-date { font-size: 0.75rem; color: #9CA3AF; }

    /* Skeleton */
    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .skeleton-card { height: 130px; background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 12px; }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* Empty */
    .empty-state { text-align: center; padding: 4rem 2rem; color: #6B7280; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }

    @media (max-width: 640px) {
      .stats-row { grid-template-columns: 1fr; }
      .hero-heading { font-size: 1.8rem; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private feedbackSvc = inject(FeedbackService);
  private authSvc = inject(AuthService);

  loading = signal(true);
  recent = signal<AnalysisResult[]>([]);
  totalAnalyses = signal(0);
  totalRows = signal(0);
  dominantSentiment = signal('—');

  firstName = () => {
    const email = this.authSvc.currentEmail() ?? '';
    return email.split('@')[0] ?? 'there';
  };

  ngOnInit() {
    this.feedbackSvc.getHistory().subscribe({
      next: list => {
        this.recent.set(list.slice(0, 6));
        this.totalAnalyses.set(list.length);
        this.totalRows.set(list.reduce((s, a) => s + (a.rowCount ?? 0), 0));
        this.dominantSentiment.set(this.calcDominant(list));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sentimentClass(s: string): string {
    return 'sentiment-badge badge-' + (s ?? 'neutral').toLowerCase();
  }

  private calcDominant(list: AnalysisResult[]): string {
    if (!list.length) return '—';
    const counts: Record<string, number> = { Positive: 0, Negative: 0, Neutral: 0 };
    list.forEach(a => { if (a.overallSentiment) counts[a.overallSentiment]++; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
}
