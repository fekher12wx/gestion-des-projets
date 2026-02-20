import api from './api';
import type { SearchResults } from '../types';

class SearchService {
    private readonly baseUrl = '/search';

    /**
     * Global search across all entities
     */
    async search(query: string, limit: number = 5): Promise<SearchResults> {
        const response = await api.get<SearchResults>(this.baseUrl, {
            params: { q: query, limit },
        });
        return response.data;
    }
}

export default new SearchService();
