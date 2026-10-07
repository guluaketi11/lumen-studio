import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Page, Stats, Status, Title, TitleInput, TitleQuery } from './models';
import { seedTitles } from './seed';

export abstract class CatalogApi {
  abstract list(query: TitleQuery): Observable<Page<Title>>;
  abstract create(input: TitleInput): Observable<Title>;
  abstract update(id: number, input: Partial<TitleInput>): Observable<Title>;
  abstract remove(id: number): Observable<void>;
  abstract stats(): Observable<Stats>;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');

@Injectable()
export class MockCatalogApi extends CatalogApi {
  private titles = seedTitles.map((title) => ({ ...title }));
  private nextId = this.titles.length + 1;
  private latency = 300;

  list(query: TitleQuery) {
    const search = query.search.trim().toLowerCase();
    const field = query.sort.replace('-', '') as keyof Title;
    const direction = query.sort.startsWith('-') ? -1 : 1;

    const filtered = this.titles
      .filter((t) => !query.genre || t.genre === query.genre)
      .filter((t) => !query.status || t.status === query.status)
      .filter((t) => !search || t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search))
      .sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * direction);

    const start = (query.page - 1) * query.limit;
    const page: Page<Title> = {
      data: filtered.slice(start, start + query.limit).map((t) => ({ ...t })),
      meta: {
        page: query.page,
        limit: query.limit,
        total: filtered.length,
        pages: Math.max(1, Math.ceil(filtered.length / query.limit)),
      },
    };
    return of(page).pipe(delay(this.latency));
  }

  create(input: TitleInput) {
    const now = new Date().toISOString();
    const title: Title = { ...input, id: this.nextId++, slug: slugify(input.title), views: 0, createdAt: now, updatedAt: now };
    this.titles.push(title);
    return of({ ...title }).pipe(delay(this.latency));
  }

  update(id: number, input: Partial<TitleInput>) {
    const title = this.titles.find((t) => t.id === id);
    if (!title) return throwError(() => new Error('Title not found'));
    Object.assign(title, input, { updatedAt: new Date().toISOString() });
    if (input.title) title.slug = slugify(input.title);
    return of({ ...title }).pipe(delay(this.latency));
  }

  remove(id: number) {
    this.titles = this.titles.filter((t) => t.id !== id);
    return of(undefined).pipe(delay(this.latency));
  }

  stats() {
    const byGenre = new Map<string, { genre: string; titles: number; views: number }>();
    const byStatus = new Map<Status, number>();
    for (const t of this.titles) {
      const genre = byGenre.get(t.genre) ?? { genre: t.genre, titles: 0, views: 0 };
      genre.titles += 1;
      genre.views += t.views;
      byGenre.set(t.genre, genre);
      byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
    }
    const stats: Stats = {
      titles: this.titles.length,
      views: this.titles.reduce((sum, t) => sum + t.views, 0),
      byGenre: [...byGenre.values()].sort((a, b) => b.views - a.views),
      byStatus: [...byStatus.entries()].map(([status, titles]) => ({ status, titles })),
    };
    return of(stats).pipe(delay(this.latency));
  }
}

@Injectable()
export class HttpCatalogApi extends CatalogApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api`;

  list(query: TitleQuery) {
    let params = new HttpParams().set('sort', query.sort).set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.genre) params = params.set('genre', query.genre);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<Page<Title>>(`${this.base}/titles`, { params });
  }

  create(input: TitleInput) {
    return this.http.post<{ data: Title }>(`${this.base}/titles`, input).pipe(map((res) => res.data));
  }

  update(id: number, input: Partial<TitleInput>) {
    return this.http.patch<{ data: Title }>(`${this.base}/titles/${id}`, input).pipe(map((res) => res.data));
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/titles/${id}`);
  }

  stats() {
    return this.http.get<{ data: Stats }>(`${this.base}/stats`).pipe(map((res) => res.data));
  }
}

export const dailyViews = (days = 30) => {
  const end = Date.UTC(2026, 9, 6);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(end - (days - 1 - i) * 86400000);
    const weekend = [0, 6].includes(date.getUTCDay());
    const trend = 2600 + i * 38;
    const wave = Math.sin(i * 1.7) * 180 + Math.cos(i * 0.6) * 120;
    return { date: date.toISOString().slice(0, 10), views: Math.round(trend + wave + (weekend ? 900 : 0)) };
  });
};
