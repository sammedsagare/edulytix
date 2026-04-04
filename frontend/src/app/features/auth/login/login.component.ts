import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <!-- Brand panel -->
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="logo-mark">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#E8FF47"/>
              <path d="M12 36L24 12L36 36H28L24 28L20 36H12Z" fill="#0A0A0A"/>
            </svg>
          </div>
          <h1 class="brand-name">Edulytix</h1>
          <p class="brand-tagline">AI-powered feedback intelligence for educators</p>
          <div class="feature-list">
            <div class="feature-item" *ngFor="let f of features">
              <span class="feature-dot"></span>{{ f }}
            </div>
          </div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="form-panel">
        <div class="form-inner">
          <h2 class="form-title">Welcome back</h2>
          <p class="form-sub">Sign in to your account</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
            <div class="field-group">
              <label class="field-label">Email</label>
              <input
                formControlName="email"
                type="email"
                class="field-input"
                [class.field-error]="isInvalid('email')"
                placeholder="you@university.edu"
              />
              <span class="error-msg" *ngIf="isInvalid('email')">Enter a valid email</span>
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <input
                formControlName="password"
                type="password"
                class="field-input"
                [class.field-error]="isInvalid('password')"
                placeholder="••••••••"
              />
              <span class="error-msg" *ngIf="isInvalid('password')">Password required</span>
            </div>

            <div class="server-error" *ngIf="serverError()">{{ serverError() }}</div>

            <button type="submit" class="submit-btn" [disabled]="loading()">
              <span *ngIf="!loading()">Sign In</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </form>

          <p class="switch-link">
            Don't have an account? <a routerLink="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

    :host { display: block; font-family: 'DM Sans', sans-serif; }

    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }

    /* Brand Panel */
    .brand-panel {
      background: #0A0A0A;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }
    .brand-panel::before {
      content: '';
      position: absolute;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(232,255,71,0.12) 0%, transparent 70%);
      top: -100px; left: -100px;
    }
    .brand-inner { position: relative; z-index: 1; max-width: 380px; }
    .logo-mark { margin-bottom: 1.5rem; }
    .brand-name {
      font-family: 'Syne', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      color: #E8FF47;
      line-height: 1;
      margin: 0 0 0.75rem;
    }
    .brand-tagline {
      color: #9CA3AF;
      font-size: 1.05rem;
      font-weight: 300;
      margin: 0 0 2.5rem;
      line-height: 1.6;
    }
    .feature-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #D1D5DB;
      font-size: 0.9rem;
    }
    .feature-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #E8FF47;
      flex-shrink: 0;
    }

    /* Form Panel */
    .form-panel {
      background: #F9FAFB;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }
    .form-inner { width: 100%; max-width: 400px; }
    .form-title {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #0A0A0A;
      margin: 0 0 0.4rem;
    }
    .form-sub { color: #6B7280; margin: 0 0 2.5rem; }

    /* Form elements */
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
    .field-input {
      padding: 0.75rem 1rem;
      border: 1.5px solid #E5E7EB;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: 'DM Sans', sans-serif;
      background: #fff;
      transition: border-color 0.2s;
      outline: none;
    }
    .field-input:focus { border-color: #0A0A0A; }
    .field-input.field-error { border-color: #EF4444; }
    .error-msg { font-size: 0.78rem; color: #EF4444; }
    .server-error {
      padding: 0.75rem 1rem;
      background: #FEE2E2;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.88rem;
    }
    .submit-btn {
      padding: 0.85rem;
      background: #0A0A0A;
      color: #E8FF47;
      border: none;
      border-radius: 8px;
      font-family: 'Syne', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, transform 0.15s;
      margin-top: 0.5rem;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(232,255,71,0.3);
      border-top-color: #E8FF47;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .switch-link {
      text-align: center;
      color: #6B7280;
      font-size: 0.9rem;
      margin-top: 1.5rem;
    }
    .switch-link a { color: #0A0A0A; font-weight: 600; text-decoration: none; }
    .switch-link a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .auth-shell { grid-template-columns: 1fr; }
      .brand-panel { display: none; }
    }
  `],
})
export class LoginComponent {
  loading = signal(false);
  serverError = signal('');

  features = [
    'Sentiment analysis across thousands of responses',
    'AI-generated summaries with LLaMA 3.1',
    'Keyword extraction with semantic diversity',
    'Per-user history and audit trail',
  ];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.serverError.set(err.error?.error ?? 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
