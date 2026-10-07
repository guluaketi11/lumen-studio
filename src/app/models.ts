export type Status = 'published' | 'draft' | 'archived';

export interface Title {
  id: number;
  slug: string;
  title: string;
  year: number;
  genre: string;
  durationMinutes: number;
  description: string;
  streamUrl: string;
  status: Status;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type TitleInput = Pick<Title, 'title' | 'year' | 'genre' | 'durationMinutes' | 'description' | 'streamUrl' | 'status'>;

export interface TitleQuery {
  search: string;
  genre: string;
  status: Status | '';
  sort: string;
  page: number;
  limit: number;
}

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface Stats {
  titles: number;
  views: number;
  byGenre: { genre: string; titles: number; views: number }[];
  byStatus: { status: Status; titles: number }[];
}

export const genres = ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror Comedy', 'Sci-Fi', 'Documentary'];

export const statuses: { value: Status; label: string }[] = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];
