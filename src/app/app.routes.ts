import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview), title: 'Overview · Lumen Studio' },
  { path: 'titles', loadComponent: () => import('./pages/titles/titles').then((m) => m.Titles), title: 'Titles · Lumen Studio' },
  { path: '**', redirectTo: '' },
];
