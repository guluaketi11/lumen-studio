import { Component, ElementRef, computed, effect, inject, input, signal } from '@angular/core';
import { formatDate, formatNumber } from '../format';

const HEIGHT = 240;
const M = { top: 12, right: 64, bottom: 28, left: 52 };

@Component({
  selector: 'app-line-chart',
  template: `
    <div class="chart" (pointerleave)="active.set(null)">
      <svg
        [attr.width]="width()"
        [attr.height]="height"
        role="img"
        [attr.aria-label]="summary()"
        tabindex="0"
        (keydown)="onKey($event)"
        (blur)="active.set(null)"
      >
        @for (tick of yTicks(); track tick.value) {
          <line class="grid" [attr.x1]="m.left" [attr.x2]="width() - m.right" [attr.y1]="tick.y" [attr.y2]="tick.y" />
          <text class="tick" [attr.x]="m.left - 10" [attr.y]="tick.y" text-anchor="end" dominant-baseline="middle">
            {{ tick.label }}
          </text>
        }
        @for (tick of xTicks(); track tick.label) {
          <text class="tick" [attr.x]="tick.x" [attr.y]="height - 6" text-anchor="middle">{{ tick.label }}</text>
        }
        <path class="area" [attr.d]="areaPath()" />
        <path class="line" [attr.d]="linePath()" />

        @if (last(); as point) {
          <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4" />
          <text class="end-label" [attr.x]="point.x + 10" [attr.y]="point.y" dominant-baseline="middle">
            {{ point.label }}
          </text>
        }

        @if (activePoint(); as point) {
          <line class="crosshair" [attr.x1]="point.x" [attr.x2]="point.x" [attr.y1]="m.top" [attr.y2]="height - m.bottom" />
          <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="5" />
        }

        <rect
          class="hit"
          [attr.x]="m.left"
          [attr.y]="m.top"
          [attr.width]="plotWidth()"
          [attr.height]="height - m.top - m.bottom"
          (pointermove)="onMove($event)"
        />
      </svg>

      @if (activePoint(); as point) {
        <div class="tooltip" [style.left.px]="point.x" [style.top.px]="point.y">
          <span>{{ point.date }}</span>
          <strong>{{ point.label }} views</strong>
        </div>
      }

      <div class="sr-only">
      <table>
        <caption>{{ summary() }}</caption>
        <tr><th>Date</th><th>Views</th></tr>
        @for (d of data(); track d.date) {
          <tr><td>{{ d.date }}</td><td>{{ d.views }}</td></tr>
        }
      </table>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .chart { position: relative; }
    svg { display: block; overflow: visible; }
    .grid { stroke: var(--grid); stroke-width: 1; }
    .tick { fill: var(--faint); font-size: 11px; font-variant-numeric: tabular-nums; }
    .line { fill: none; stroke: var(--series-1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .area { fill: var(--series-1); opacity: 0.1; }
    .dot { fill: var(--series-1); stroke: var(--surface); stroke-width: 2; }
    .end-label { fill: var(--ink); font-size: 12px; font-weight: 600; }
    .crosshair { stroke: var(--faint); stroke-width: 1; }
    .hit { fill: transparent; cursor: crosshair; }
    .tooltip {
      position: absolute;
      transform: translate(-50%, calc(-100% - 14px));
      display: grid;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--ink);
      color: var(--bg);
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
    }
    .tooltip span { opacity: 0.7; }
  `,
})
export class LineChart {
  readonly data = input.required<{ date: string; views: number }[]>();
  protected readonly height = HEIGHT;
  protected readonly m = M;
  protected readonly width = signal(600);
  protected readonly active = signal<number | null>(null);

  private host = inject(ElementRef<HTMLElement>);

  constructor() {
    const observer = new ResizeObserver(([entry]) => this.width.set(Math.max(280, entry.contentRect.width)));
    effect((onCleanup) => {
      observer.observe(this.host.nativeElement);
      onCleanup(() => observer.disconnect());
    });
  }

  protected plotWidth = computed(() => this.width() - M.left - M.right);

  private yMax = computed(() => {
    const max = Math.max(...this.data().map((d) => d.views));
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / step) * step;
  });

  private x = (i: number) => M.left + (i / (this.data().length - 1)) * this.plotWidth();
  private y = (v: number) => M.top + (1 - v / this.yMax()) * (HEIGHT - M.top - M.bottom);

  protected points = computed(() =>
    this.data().map((d, i) => ({
      x: this.x(i),
      y: this.y(d.views),
      label: formatNumber(d.views),
      date: formatDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' }),
    })),
  );

  protected linePath = computed(() => this.points().map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '));

  protected areaPath = computed(() => {
    const pts = this.points();
    const base = HEIGHT - M.bottom;
    return `${this.linePath()} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`;
  });

  protected yTicks = computed(() => {
    const max = this.yMax();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      value: max * f,
      y: this.y(max * f),
      label: formatNumber(max * f),
    }));
  });

  protected xTicks = computed(() =>
    this.data()
      .map((d, i) => ({ i, d }))
      .filter(({ i }) => i % 7 === 0)
      .map(({ i, d }) => ({ x: this.x(i), label: formatDate(d.date) })),
  );

  protected last = computed(() => (this.active() === null ? this.points().at(-1) : null));
  protected activePoint = computed(() => {
    const i = this.active();
    return i === null ? null : this.points()[i];
  });

  protected summary = computed(() => {
    const d = this.data();
    return `Daily views from ${d[0].date} to ${d[d.length - 1].date}, latest ${formatNumber(d[d.length - 1].views)}`;
  });

  protected onMove(event: PointerEvent) {
    const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    this.active.set(Math.round(ratio * (this.data().length - 1)));
  }

  protected onKey(event: KeyboardEvent) {
    const last = this.data().length - 1;
    const current = this.active() ?? last;
    if (event.key === 'ArrowLeft') this.active.set(Math.max(0, current - 1));
    else if (event.key === 'ArrowRight') this.active.set(Math.min(last, current + 1));
    else if (event.key === 'Escape') this.active.set(null);
    else return;
    event.preventDefault();
  }
}
