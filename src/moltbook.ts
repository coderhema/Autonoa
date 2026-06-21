import type {
  MoltbookConfig,
  MoltbookAgent,
  MoltbookPost,
  MoltbookSearchResult,
} from './types';

const BASE = 'https://www.moltbook.com/api/v1';

export class MoltbookClient {
  private cfg: MoltbookConfig;

  constructor(cfg: MoltbookConfig) {
    this.cfg = cfg;
  }

  get enabled(): boolean {
    return this.cfg.enabled;
  }

  private auth() {
    return { Authorization: `Bearer ${this.cfg.apiKey}`, 'Content-Type': 'application/json' };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { headers: this.auth() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Moltbook GET ${path} ${res.status}: ${text}`);
    }
    return res.json();
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: this.auth(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Moltbook POST ${path} ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getProfile(): Promise<MoltbookAgent> {
    const data = await this.get<{ agent: MoltbookAgent }>('/agents/me');
    return data.agent;
  }

  async getHomeFeed(): Promise<MoltbookPost[]> {
    const data = await this.get<{
      posts_from_accounts_you_follow: { posts: MoltbookPost[] };
    }>('/feed?sort=new&limit=10');
    return data.posts_from_accounts_you_follow?.posts ?? [];
  }

  async searchSentiment(query: string): Promise<MoltbookSearchResult[]> {
    const q = encodeURIComponent(query);
    const data = await this.get<{ results: MoltbookSearchResult[] }>(`/search?q=${q}&limit=10&type=posts`);
    return data.results ?? [];
  }

  async createPost(title: string, content: string, submolt?: string): Promise<string> {
    const data = await this.post<{ post: { id: string }; verification_required?: boolean; verification?: unknown }>('/posts', {
      submolt_name: submolt ?? this.cfg.submoltName,
      title,
      content,
    });
    if (data.verification_required) {
      console.warn('[Moltbook] Verification challenge required — post queued but not yet visible');
    }
    return data.post.id;
  }
}
