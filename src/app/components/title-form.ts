import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title, TitleInput, genres, statuses } from '../models';

@Component({
  selector: 'app-title-form',
  imports: [ReactiveFormsModule],
  templateUrl: './title-form.html',
  styleUrl: './title-form.css',
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class TitleForm {
  readonly title = input<Title | null>(null);
  readonly saving = input(false);
  readonly save = output<TitleInput>();
  readonly remove = output<Title>();
  readonly close = output<void>();

  protected readonly genres = genres;
  protected readonly statuses = statuses;
  protected readonly confirming = signal(false);
  protected readonly submitted = signal(false);
  protected readonly isNew = computed(() => !this.title());

  private fb = inject(FormBuilder);
  protected form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1888), Validators.max(new Date().getFullYear() + 2)]],
    genre: ['', Validators.required],
    durationMinutes: [10, [Validators.required, Validators.min(1), Validators.max(600)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    streamUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/\S+\.m3u8(\?\S*)?$/)]],
    status: ['draft' as Title['status'], Validators.required],
  });

  constructor() {
    effect(() => {
      const title = this.title();
      this.confirming.set(false);
      this.submitted.set(false);
      if (title) this.form.reset({ ...title });
      else this.form.reset();
    });
  }

  protected error(name: keyof typeof this.form.controls) {
    const control = this.form.controls[name];
    if (!control.errors || !(control.touched || this.submitted())) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['min']) return `Must be at least ${control.errors['min'].min}`;
    if (control.errors['max']) return `Must be ${control.errors['max'].max} or less`;
    if (control.errors['minlength']) return `Write at least ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength']) return `Keep it under ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Use an HLS link that ends in .m3u8';
    return 'Check this value';
  }

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({ ...value, title: value.title.trim(), description: value.description.trim() });
  }
}
