import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { CatalogApi } from '../../catalog-api';
import { TitleForm } from '../../components/title-form';
import { formatCompact, formatDate, formatNumber } from '../../format';
import { Page, Status, Title, TitleInput, TitleQuery, genres, statuses } from '../../models';
import { ToastService } from '../../toast.service';

const initialQuery: TitleQuery = { search: '', genre: '', status: '', sort: '-views', page: 1, limit: 8 };

@Component({
  selector: 'app-titles',
  imports: [TitleForm],
  templateUrl: './titles.html',
  styleUrl: './titles.css',
})
export class Titles {
  private api = inject(CatalogApi);
  private toast = inject(ToastService);

  protected readonly genres = genres;
  protected readonly statuses = statuses;
  protected readonly query = signal<TitleQuery>({ ...initialQuery });
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly editing = signal<Title | null | undefined>(undefined);
  protected readonly saving = signal(false);
  private readonly reload = signal(0);

  protected formatNumber = formatNumber;
  protected formatCompact = formatCompact;
  protected formatDate = formatDate;

  protected readonly page = toSignal(
    toObservable(computed(() => ({ query: this.query(), reload: this.reload() }))).pipe(
      tap(() => this.loading.set(true)),
      debounceTime(180),
      switchMap(({ query }) =>
        this.api.list(query).pipe(
          tap(() => this.failed.set(false)),
          catchError(() => {
            this.failed.set(true);
            return of(null);
          }),
        ),
      ),
      tap(() => this.loading.set(false)),
    ),
  );

  protected readonly hasFilters = computed(() => {
    const q = this.query();
    return !!(q.search || q.genre || q.status);
  });

  protected readonly range = computed(() => {
    const meta = this.page()?.meta;
    if (!meta || !meta.total) return '';
    const start = (meta.page - 1) * meta.limit + 1;
    return `${start}–${Math.min(meta.total, start + meta.limit - 1)} of ${meta.total}`;
  });

  protected update(changes: Partial<TitleQuery>) {
    this.query.update((q) => ({ ...q, page: 1, ...changes }));
  }

  protected setStatus(status: Status | '') {
    this.update({ status });
  }

  protected sortBy(field: string) {
    const current = this.query().sort;
    const sort = current === `-${field}` ? field : `-${field}`;
    this.update({ sort });
  }

  protected sortState(field: string) {
    const sort = this.query().sort;
    if (sort === field) return 'ascending';
    if (sort === `-${field}`) return 'descending';
    return 'none';
  }

  protected goTo(page: number) {
    this.query.update((q) => ({ ...q, page }));
  }

  protected clearFilters() {
    this.query.set({ ...initialQuery });
  }

  protected statusLabel(status: Status) {
    return statuses.find((s) => s.value === status)?.label ?? status;
  }

  protected onSave(input: TitleInput) {
    const current = this.editing();
    const request: Observable<Title> = current ? this.api.update(current.id, input) : this.api.create(input);
    this.saving.set(true);
    request.subscribe({
      next: (title) => {
        this.saving.set(false);
        this.editing.set(undefined);
        this.reload.update((n) => n + 1);
        this.toast.show(current ? `Saved “${title.title}”` : `Created “${title.title}”`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Could not save the title. Try again.', 'error');
      },
    });
  }

  protected onRemove(title: Title) {
    this.saving.set(true);
    this.api.remove(title.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(undefined);
        this.reload.update((n) => n + 1);
        this.toast.show(`Deleted “${title.title}”`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Could not delete the title. Try again.', 'error');
      },
    });
  }

  protected pages(page: Page<Title>) {
    return Array.from({ length: page.meta.pages }, (_, i) => i + 1);
  }
}
