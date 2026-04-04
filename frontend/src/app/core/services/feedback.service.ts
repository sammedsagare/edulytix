import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalysisResult } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

/**
 * Service for CSV upload and history API calls.
 * The auth interceptor automatically attaches the Bearer token.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private http: HttpClient) {}

  /**
   * Upload the file first to get available columns.
   */
  getColumns(file: File): Observable<string[]> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<string[]>(`${environment.apiUrl}/columns`, form);
  }

  /**
   * Upload CSV with a chosen column; triggers full AI analysis.
   */
  analyze(file: File, column: string): Observable<AnalysisResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('column', column);
    return this.http.post<AnalysisResult>(`${environment.apiUrl}/upload`, form);
  }

  /**
   * Fetch analysis history for the current user.
   */
  getHistory(): Observable<AnalysisResult[]> {
    return this.http.get<AnalysisResult[]>(`${environment.apiUrl}/history`);
  }
}
