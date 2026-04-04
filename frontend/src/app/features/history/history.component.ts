import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { AnalysisResult } from '../../shared/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, DecimalPipe, FormsModule],
  template: `
    <app-navbar />

    <main class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analysis History</h1>
          <p class="page-sub">All your past feedback analyses, newest first.</p>
        </div>
        <a routerLink="/upload" class="new-btn">+ New Analysis</a>
      </div>

      <!-- Filters -->
      <div class="filter-bar" *ngIf="!loading() && all().length > 0">
        <input
          class="search-input"
          type="text"
          placeholder="Search by file name or column…"
          [(ngModel)]="searchQuery"
        />
        <div class="filter-chips">
          <button
            class="chip"
            [class.active]="sentimentFilter() === ''"
            (click)="sentimentFilter.set('')"
          >All</button>
          <button
            class="chip positive"
            [class.active]="sentimentFilter() === 'Positive'"
            (click)="sentimentFilter.set('Positive')"
          >Positive</button>
          <button
            class="chip neutral"
            [class.active]="sentimentFilter() === 'Neutral'"
            (click)="sentimentFilter.set('Neutral')"
          >Neutral</button>
          <button
            class="chip negative"
            [class.active]="sentimentFilter() === 'Negative'"
            (click)="sentimentFilter.set('Negative')"
          >Negative</button>
        </div>
        <span class="result-count">{{ filtered().length }} result{{ filtered().length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Loading skeletons -->
      <div class="skeleton-list" *ngIf="loading()">
        <div class="skeleton-row" *ngFor="let n of [1,2,3,4,5]"></div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading() && all().length === 0">
        <div class="empty-icon">📂</div>
        <h2>No analyses yet</h2>
        <p>Upload your first CSV to generate insights.</p>
        <a routerLink="/upload" class="new-btn">Upload CSV</a>
      </div>

      <!-- No filter match -->
      <div class="empty-state" *ngIf="!loading() && all().length > 0 && filtered().length === 0">
        <div class="empty-icon">🔍</div>
        <p>No analyses match your search.</p>
      </div>

      <!-- Table -->
      <div class="table-wrapper" *ngIf="!loading() && filtered().length > 0">
        <table class="history-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Column</th>
              <th>Rows</th>
              <th>Sentiment</th>
              <th>Distribution</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of filtered()" class="table-row">
              <td class="td-file">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ a.fileName }}</span>
              </td>
              <td class="td-col">{{ a.selectedColumn }}</td>
              <td class="td-rows">{{ a.rowCount | number }}</td>
              <td>
                <span class="sentiment-badge" [class]="badgeClass(a.overallSentiment)">
                  {{ a.overallSentiment }}
                </span>
              </td>
              <td class="td-dist">
                <div class="mini-bar-row" *ngIf="a.sentimentDistribution">
                  <div class="mini-bar pos" [style.width.%]="a.sentimentDistribution['Positive'] || 0" [title]="'Positive: ' + (a.sentimentDistribution['Positive'] || 0) + '%'"></div>
                  <div class="mini-bar neu" [style.width.%]="a.sentimentDistribution['Neutral'] || 0" [title]="'Neutral: ' + (a.sentimentDistribution['Neutral'] || 0) + '%'"></div>
                  <div class="mini-bar neg" [style.width.%]="a.sentimentDistribution['Negative'] || 0" [title]="'Negative: ' + (a.sentimentDistribution['Negative'] || 0) + '%'"></div>
                </div>
              </td>
              <td class="td-date">{{ a.createdAt | date:'MMM d, y' }}</td>
              <td>
                <a [routerLink]="['/results', a.id]" class="view-link">View →</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; min-height: 100vh; background: #F3F4F6; font-family: 'DM Sans', sans-serif; }
    .page { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #0A0A0A; margin: 0 0 0.3rem; }
    .page-sub { color: #6B7280; margin: 0; }
    .new-btn {
      display: inline-flex; align-items: center; padding: 0.65rem 1.25rem;
      background: #0A0A0A; color: #E8FF47; border-radius: 8px; text-decoration: none;
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.88rem;
      white-space: nowrap; transition: opacity 0.2s;
    }
    .new-btn:hover { opacity: 0.85; }

    /* Filters */
    .filter-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .search-input {
      flex: 1; min-width: 200px; padding: 0.6rem 1rem; border: 1.5px solid #E5E7EB;
      border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      outline: none; background: #fff; transition: border-color 0.2s;
    }
    .search-input:focus { border-color: #0A0A0A; }
    .filter-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .chip {
      padding: 0.35rem 0.85rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500;
      border: 1.5px solid #E5E7EB; background: #fff; cursor: pointer; transition: all 0.15s;
      font-family: 'DM Sans', sans-serif;
    }
    .chip:hover { border-color: #9CA3AF; }
    .chip.active { background: #0A0A0A; color: #fff; border-color: #0A0A0A; }
    .chip.positive.active { background: #065F46; border-color: #065F46; }
    .chip.neutral.active  { background: #374151; border-color: #374151; }
    .chip.negative.active { background: #991B1B; border-color: #991B1B; }
    .result-count { font-size: 0.82rem; color: #9CA3AF; white-space: nowrap; margin-left: auto; }

    /* Skeleton */
    .skeleton-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .skeleton-row { height: 52px; background: linear-gradient(90deg,#E5E7EB 25%,#F3F4F6 50%,#E5E7EB 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 10px; }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* Empty */
    .empty-state { text-align: center; padding: 4rem 2rem; color: #6B7280; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h2 { font-family: 'Syne', sans-serif; color: #0A0A0A; margin: 0 0 0.5rem; }

    /* Table */
    .table-wrapper { background: #fff; border-radius: 14px; border: 1px solid #E5E7EB; overflow: hidden; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table thead th {
      padding: 0.9rem 1rem; text-align: left; font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6B7280; font-weight: 600; background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
    }
    .table-row { border-bottom: 1px solid #F3F4F6; transition: background 0.15s; }
    .table-row:hover { background: #F9FAFB; }
    .table-row:last-child { border-bottom: none; }
    .history-table td { padding: 0.85rem 1rem; vertical-align: middle; }

    .td-file { display: flex; align-items: center; gap: 0.5rem; }
    .file-icon { font-size: 1rem; flex-shrink: 0; }
    .file-name { font-size: 0.88rem; color: #111827; font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-col { font-size: 0.85rem; color: #6B7280; }
    .td-rows { font-size: 0.85rem; color: #374151; }
    .td-date { font-size: 0.82rem; color: #9CA3AF; white-space: nowrap; }

    .sentiment-badge { font-size: 0.72rem; padding: 0.22rem 0.65rem; border-radius: 999px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    .badge-positive { background: #D1FAE5; color: #065F46; }
    .badge-negative { background: #FEE2E2; color: #991B1B; }
    .badge-neutral  { background: #E5E7EB; color: #374151; }

    .td-dist { width: 120px; }
    .mini-bar-row { display: flex; height: 8px; border-radius: 4px; overflow: hidden; gap: 1px; width: 100px; }
    .mini-bar { height: 100%; }
    .pos { background: #10B981; }
    .neu { background: #D1D5DB; }
    .neg { background: #EF4444; }

    .view-link { color: #4F46E5; text-decoration: none; font-size: 0.85rem; font-weight: 500; white-space: nowrap; }
    .view-link:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .table-wrapper { overflow-x: auto; }
      .td-dist { display: none; }
    }
  `],
})
export class HistoryComponent implements OnInit {
  private feedbackSvc = inject(FeedbackService);

  loading = signal(true);
  all = signal<AnalysisResult[]>([]);
  sentimentFilter = signal('');
  searchQuery = '';

  filtered = computed(() => {
    let list = this.all();
    if (this.sentimentFilter()) {
      list = list.filter(a => a.overallSentiment === this.sentimentFilter());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        a.fileName?.toLowerCase().includes(q) ||
        a.selectedColumn?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.feedbackSvc.getHistory().subscribe({
      next: list => { this.all.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  badgeClass(sentiment: string): string {
    return 'sentiment-badge badge-' + (sentiment ?? 'neutral').toLowerCase();
  }
}
