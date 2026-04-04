import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="logo-mark">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#E8FF47"/>
              <path d="M12 36L24 12L36 36H28L24 28L20 36H12Z" fill="#0A0A0A"/>
            </svg>
          </div>
          <h1 class="brand-name">Edulytix</h1>
          <p class="brand-tagline">Start analysing student feedback with AI in minutes.</p>
          <div class="steps">
            <div class="step" *ngFor="let s of steps; let i = index">
              <div class="step-num">{{ i + 1 }}</div>
              <span>{{ s }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="form-inner">
          <h2 class="form-title">Create account</h2>
          <p class="form-sub">Join Edulytix — it's free</p>

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
              <label class="field-label">Password <span class="hint">(min 6 chars)</span></label>
              <input
                formControlName="password"
                type="password"
                class="field-input"
                [class.field-error]="isInvalid('password')"
                placeholder="••••••••"
              />
              <span class="error-msg" *ngIf="isInvalid('password')">At least 6 characters required</span>
            </div>

            <div class="field-group">
              <label class="field-label">Confirm Password</label>
              <input
                formControlName="confirmPassword"
                type="password"
                class="field-input"
                [class.field-error]="isInvalid('confirmPassword') || (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched)"
                placeholder="••••••••"
              />
              <span class="error-msg" *ngIf="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched">
                Passwords do not match
              </span>
            </div>

            <div class="server-error" *ngIf="serverError()">{{ serverError() }}</div>

            <button type="submit" class="submit-btn" [disabled]="loading()">
              <span *ngIf="!loading()">Create Account</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </form>

          <p class="switch-link">
            Already have an account? <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    :host { display: block; font-family: 'DM Sans', sans-serif; }
    .auth-shell { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
    .brand-panel { background: #0A0A0A; display: flex; align-items: center; justify-content: center; padding: 3rem; position: relative; overflow: hidden; }
    .brand-panel::before { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(232,255,71,0.12) 0%, transparent 70%); bottom: -150px; right: -100px; }
    .brand-inner { position: relative; z-index: 1; max-width: 380px; }
    .logo-mark { margin-bottom: 1.5rem; }
    .brand-name { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 800; color: #E8FF47; line-height: 1; margin: 0 0 0.75rem; }
    .brand-tagline { color: #9CA3AF; font-size: 1.05rem; font-weight: 300; margin: 0 0 2.5rem; line-height: 1.6; }
    .steps { display: flex; flex-direction: column; gap: 1.25rem; }
    .step { display: flex; align-items: center; gap: 1rem; color: #D1D5DB; font-size: 0.9rem; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; background: #E8FF47; color: #0A0A0A; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .form-panel { background: #F9FAFB; display: flex; align-items: center; justify-content: center; padding: 3rem; }
    .form-inner { width: 100%; max-width: 400px; }
    .form-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 700; color: #0A0A0A; margin: 0 0 0.4rem; }
    .form-sub { color: #6B7280; margin: 0 0 2.5rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
    .hint { font-weight: 300; color: #9CA3AF; font-size: 0.8rem; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 0.95rem; font-family: 'DM Sans', sans-serif; background: #fff; transition: border-color 0.2s; outline: none; }
    .field-input:focus { border-color: #0A0A0A; }
    .field-input.field-error { border-color: #EF4444; }
    .error-msg { font-size: 0.78rem; color: #EF4444; }
    .server-error { padding: 0.75rem 1rem; background: #FEE2E2; border-radius: 8px; color: #DC2626; font-size: 0.88rem; }
    .submit-btn { padding: 0.85rem; background: #0A0A0A; color: #E8FF47; border: none; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s, transform 0.15s; margin-top: 0.5rem; }
    .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(232,255,71,0.3); border-top-color: #E8FF47; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .switch-link { text-align: center; color: #6B7280; font-size: 0.9rem; margin-top: 1.5rem; }
    .switch-link a { color: #0A0A0A; font-weight: 600; text-decoration: none; }
    .switch-link a:hover { text-decoration: underline; }
    @media (max-width: 768px) { .auth-shell { grid-template-columns: 1fr; } .brand-panel { display: none; } }
  `],
})
export class SignupComponent {
  loading = signal(false);
  serverError = signal('');

  steps = [
    'Create your free account',
    'Upload any CSV with student feedback',
    'Pick a column and trigger AI analysis',
  ];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

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

    const { email, password } = this.form.value;
    this.auth.signup({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.serverError.set(err.error?.error ?? 'Signup failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
