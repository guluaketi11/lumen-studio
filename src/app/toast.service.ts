import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<{ text: string; tone: 'ok' | 'error' } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string, tone: 'ok' | 'error' = 'ok') {
    clearTimeout(this.timer);
    this.message.set({ text, tone });
    this.timer = setTimeout(() => this.message.set(null), 3200);
  }
}
