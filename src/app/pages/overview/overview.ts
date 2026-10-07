import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CatalogApi, dailyViews } from '../../catalog-api';
import { BarList } from '../../components/bar-list';
import { LineChart } from '../../components/line-chart';
import { StatusBar } from '../../components/status-bar';
import { formatCompact, formatNumber } from '../../format';

@Component({
  selector: 'app-overview',
  imports: [LineChart, BarList, StatusBar, RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {
  private api = inject(CatalogApi);

  protected stats = toSignal(this.api.stats());
  protected top = toSignal(
    this.api.list({ search: '', genre: '', status: '', sort: '-views', page: 1, limit: 5 }),
  );
  protected daily = dailyViews();

  protected formatNumber = formatNumber;
  protected formatCompact = formatCompact;

  protected monthViews = this.daily.reduce((sum, d) => sum + d.views, 0);
  protected change = (() => {
    const half = this.daily.length / 2;
    const prev = this.daily.slice(0, half).reduce((s, d) => s + d.views, 0);
    const curr = this.daily.slice(half).reduce((s, d) => s + d.views, 0);
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  })();

  protected tiles = computed(() => {
    const stats = this.stats();
    if (!stats) return null;
    const count = (status: string) => stats.byStatus.find((s) => s.status === status)?.titles ?? 0;
    return {
      views: stats.views,
      titles: stats.titles,
      published: count('published'),
      drafts: count('draft'),
    };
  });

  protected genres = computed(
    () => this.stats()?.byGenre.map((g) => ({ label: g.genre, value: g.views, count: g.titles })) ?? [],
  );
}
