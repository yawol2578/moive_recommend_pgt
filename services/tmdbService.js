const axios = require('axios');
require('dotenv').config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const tmdbService = {
    async getPopularMovies() {
        try {
            const response = await axios.get(`${BASE_URL}/movie/popular`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching popular movies:', error);
            throw error;
        }
    },

    async getMovieDetails(movieId) {
        try {
            const response = await axios.get(`${BASE_URL}/movie/${movieId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            throw error;
        }
    },

    async searchMovies(query) {
        try {
            const response = await axios.get(`${BASE_URL}/search/movie`, {
                params: {
                    api_key: TMDB_API_KEY,
                    query: query,
                    language: 'ko-KR'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching movies:', error);
            throw error;
        }
    }
};

module.exports = tmdbService; 