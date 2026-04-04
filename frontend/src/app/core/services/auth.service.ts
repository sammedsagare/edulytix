import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, SignupRequest } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'edulytix_token';
const EMAIL_KEY = 'edulytix_email';

/**
 * AuthService manages JWT token storage and exposes auth state via Signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _email = signal<string | null>(localStorage.getItem(EMAIL_KEY));

  /** True when a valid token is present. */
  readonly isLoggedIn = computed(() => !!this._token());
  readonly currentEmail = computed(() => this._email());
  readonly token = computed(() => this._token());

  constructor(private http: HttpClient, private router: Router) {}

  signup(payload: SignupRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/signup`, payload)
      .pipe(tap(res => this.storeSession(res)));
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this._token.set(null);
    this._email.set(null);
    this.router.navigate(['/login']);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(EMAIL_KEY, res.email);
    this._token.set(res.token);
    this._email.set(res.email);
  }
}
