import { Component, computed, input, signal } from '@angular/core';
import { formatCompact, formatNumber } from '../format';

@Component({
  selector: 'app-bar-list',
  template: `
    <ul class="bars" role="list">
      @for (row of rows(); track row.label) {
        <li
          class="row"
          tabindex="0"
          (pointerenter)="active.set(row.label)"
          (pointerleave)="active.set(null)"
          (focus)="active.set(row.label)"
          (blur)="active.set(null)"
          [attr.aria-label]="row.label + ': ' + row.full + ' views across ' + row.count + ' titles'"
        >
          <span class="label">{{ row.label }}</span>
          <span class="track">
            <span class="bar" [style.width.%]="row.pct"></span>
            <span class="value">{{ row.short }}</span>
          </span>
          @if (active() === row.label) {
            <span class="tooltip" [style.left.%]="row.pct * 0.72 + 28">
              <strong>{{ row.label }}</strong>
              <span>{{ row.full }} views · {{ row.count }} {{ row.count === 1 ? 'title' : 'titles' }}</span>
            </span>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: block; }
    .bars { list-style: none; display: grid; gap: 12px; }
    .row {
      position: relative;
      display: grid;
      grid-template-columns: minmax(96px, 28%) 1fr;
      align-items: center;
      gap: 12px;
      border-radius: 6px;
    }
    .label { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .track { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .bar {
      height: 20px;
      min-width: 4px;
      max-width: calc(100% - 52px);
      border-radius: 0 4px 4px 0;
      background: var(--series-1);
      transition: width 400ms ease;
    }
    .row:hover .bar, .row:focus-visible .bar { filter: brightness(1.08); }
    .value { font-size: 12px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
    .tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      transform: translateX(-50%);
      display: grid;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--ink);
      color: var(--bg);
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 2;
    }
    .tooltip span { opacity: 0.75; }
  `,
})
export class BarList {
  readonly data = input.required<{ label: string; value: number; count: number }[]>();
  protected readonly active = signal<string | null>(null);

  protected rows = computed(() => {
    const max = Math.max(...this.data().map((d) => d.value), 1);
    return this.data().map((d) => ({
      label: d.label,
      count: d.count,
      pct: (d.value / max) * 100,
      short: formatCompact(d.value),
      full: formatNumber(d.value),
    }));
  });
}
