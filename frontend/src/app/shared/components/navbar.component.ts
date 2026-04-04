import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a routerLink="/dashboard" class="nav-logo">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="10" fill="#E8FF47"/>
          <path d="M12 36L24 12L36 36H28L24 28L20 36H12Z" fill="#0A0A0A"/>
        </svg>
        <span>Edulytix</span>
      </a>
      <div class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dashboard</a>
        <a routerLink="/upload" routerLinkActive="active">Analyze</a>
        <a routerLink="/history" routerLinkActive="active">History</a>
      </div>
      <div class="nav-user">
        <span class="user-email">{{ auth.currentEmail() }}</span>
        <button class="logout-btn" (click)="auth.logout()">Sign out</button>
      </div>
    </nav>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
    :host { display: block; }
    .navbar { display:flex; align-items:center; padding:0 2rem; height:64px; background:#0A0A0A; border-bottom:1px solid #1A1A1A; gap:2rem; }
    .nav-logo { display:flex; align-items:center; gap:0.6rem; text-decoration:none; font-family:'Syne',sans-serif; font-weight:800; font-size:1.2rem; color:#E8FF47; }
    .nav-links { display:flex; gap:0.25rem; flex:1; margin-left:1rem; }
    .nav-links a { padding:0.4rem 0.9rem; border-radius:6px; text-decoration:none; color:#9CA3AF; font-family:'DM Sans',sans-serif; font-size:0.9rem; transition:color 0.2s,background 0.2s; }
    .nav-links a:hover { color:#fff; background:#1A1A1A; }
    .nav-links a.active { color:#E8FF47; background:#1A1A1A; }
    .nav-user { display:flex; align-items:center; gap:1rem; }
    .user-email { font-size:0.82rem; color:#6B7280; font-family:'DM Sans',sans-serif; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .logout-btn { padding:0.4rem 0.9rem; background:transparent; border:1px solid #374151; border-radius:6px; color:#9CA3AF; font-family:'DM Sans',sans-serif; font-size:0.82rem; cursor:pointer; transition:border-color 0.2s,color 0.2s; }
    .logout-btn:hover { border-color:#E8FF47; color:#E8FF47; }
  `],
})
export class NavbarComponent {
  auth = inject(AuthService);
}
