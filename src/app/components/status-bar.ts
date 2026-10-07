import { Component, computed, input, signal } from '@angular/core';
import { Status, statuses } from '../models';

@Component({
  selector: 'app-status-bar',
  template: `
    <div class="stack" role="img" [attr.aria-label]="summary()">
      @for (seg of segments(); track seg.value) {
        <span
          [class]="'seg ' + seg.value"
          [style.flex-grow]="seg.count"
          (pointerenter)="active.set(seg.value)"
          (pointerleave)="active.set(null)"
        ></span>
      }
    </div>
    <ul class="legend">
      @for (seg of segments(); track seg.value) {
        <li [class.is-dim]="active() && active() !== seg.value">
          <span [class]="'status-dot ' + seg.value"></span>
          <span class="name">{{ seg.label }}</span>
          <span class="count">{{ seg.count }}</span>
          <span class="pct">{{ seg.pct }}%</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: block; }
    .stack { display: flex; gap: 2px; height: 20px; margin-bottom: 18px; }
    .seg { min-width: 4px; transition: opacity 150ms ease; }
    .seg:first-child { border-radius: 4px 0 0 4px; }
    .seg:last-child { border-radius: 0 4px 4px 0; }
    .seg.published { background: var(--series-1); }
    .seg.draft { background: var(--series-2); }
    .seg.archived { background: var(--series-3); }
    .stack:hover .seg { opacity: 0.45; }
    .stack .seg:hover { opacity: 1; }
    .legend { list-style: none; display: grid; gap: 10px; }
    .legend li {
      display: grid;
      grid-template-columns: 8px 1fr auto 44px;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      transition: opacity 150ms ease;
    }
    .legend li.is-dim { opacity: 0.45; }
    .name { color: var(--muted); }
    .count { font-weight: 600; font-variant-numeric: tabular-nums; }
    .pct { color: var(--faint); text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class StatusBar {
  readonly data = input.required<{ status: Status; titles: number }[]>();
  protected readonly active = signal<Status | null>(null);

  protected segments = computed(() => {
    const total = this.data().reduce((sum, d) => sum + d.titles, 0) || 1;
    return statuses.map((s) => {
      const count = this.data().find((d) => d.status === s.value)?.titles ?? 0;
      return { ...s, count, pct: Math.round((count / total) * 100) };
    });
  });

  protected summary = computed(() =>
    this.segments()
      .map((s) => `${s.label}: ${s.count}`)
      .join(', '),
  );
}
