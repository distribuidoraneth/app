/**
 * Cliente Ligero y de Alto Rendimiento para Supabase REST API (PostgREST)
 * No requiere librerías pesadas, 100% compatible con Edge Runtime y Node.js de Next.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export class SupabaseRestClient {
  private url: string;
  private key: string;

  constructor(url?: string, key?: string) {
    this.url = (url || SUPABASE_URL).replace(/\/$/, '');
    this.key = key || SUPABASE_ANON_KEY;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      Prefer: 'return=representation',
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.key);
  }

  /**
   * Consulta registros en una tabla
   */
  async from<T = any>(table: string, queryParams: string = ''): Promise<SupabaseResponse<T[]>> {
    if (!this.isConfigured()) {
      return { data: null, error: 'Supabase no está configurado en variables de entorno' };
    }

    try {
      const endpoint = `${this.url}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.headers(),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: errText };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Error de red con Supabase' };
    }
  }

  /**
   * Inserta un nuevo registro
   */
  async insert<T = any>(table: string, record: any): Promise<SupabaseResponse<T>> {
    if (!this.isConfigured()) {
      return { data: null, error: 'Supabase no está configurado en variables de entorno' };
    }

    try {
      const endpoint = `${this.url}/rest/v1/${table}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(record),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: errText };
      }

      const data = await res.json();
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Error al insertar en Supabase' };
    }
  }
}

export const supabase = new SupabaseRestClient();
