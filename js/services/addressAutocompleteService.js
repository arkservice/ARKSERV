// Service d'autocomplétion d'adresses utilisant l'API officielle française
class AddressAutocompleteService {
    constructor() {
        this.baseUrl = 'https://api-adresse.data.gouv.fr/search/';
        this.debounceTimeout = null;
        this.debounceDelay = 300; // 300ms
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Fonction principale de recherche avec debounce
    async searchAddresses(query, callback, limit = 5) {
        if (!query || query.trim().length < 3) {
            callback([]);
            return;
        }

        // Annuler la recherche précédente
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Programmer la nouvelle recherche
        this.debounceTimeout = setTimeout(async () => {
            try {
                const results = await this.performSearch(query.trim(), limit);
                callback(results);
            } catch (error) {
                console.error('Erreur lors de la recherche d\'adresse:', error);
                callback([]);
            }
        }, this.debounceDelay);
    }

    // Recherche effective avec cache
    async performSearch(query, limit) {
        const cacheKey = `${query.toLowerCase()}-${limit}`;
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('q', query);
            url.searchParams.append('type', 'housenumber');
            url.searchParams.append('limit', limit.toString());

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const formattedResults = this.formatResults(data.features || []);
            
            // Mise en cache
            this.cache.set(cacheKey, {
                data: formattedResults,
                timestamp: Date.now()
            });

            return formattedResults;
        } catch (error) {
            console.error('Erreur API adresse:', error);
            return [];
        }
    }

    // Formatage des résultats de l'API
    formatResults(features) {
        return features.map(feature => {
            const properties = feature.properties;
            const coordinates = feature.geometry.coordinates;
            
            return {
                id: feature.properties.id || Math.random().toString(36).substr(2, 9),
                label: properties.label || '',
                address: properties.name || '',
                postcode: properties.postcode || '',
                city: properties.city || '',
                context: properties.context || '',
                coordinates: {
                    lon: coordinates[0],
                    lat: coordinates[1]
                },
                score: properties.score || 0
            };
        }).sort((a, b) => b.score - a.score); // Trier par score décroissant
    }

    // Nettoyage du cache (optionnel)
    clearCache() {
        this.cache.clear();
    }

    // Annuler les recherches en cours
    cancelPendingSearches() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }
}

// Instance globale du service
window.AddressAutocompleteService = AddressAutocompleteService;
window.addressAutocompleteService = new AddressAutocompleteService();