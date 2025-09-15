export interface Cafe {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  location?: string;
  [key: string]: unknown;
}
