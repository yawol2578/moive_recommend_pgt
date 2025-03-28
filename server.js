const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const tmdbService = require('./services/tmdbService');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 인증 관련 라우트
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = md5(password);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Error creating user' });
            }
            res.status(201).json({ message: 'User created successfully' });
        });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = md5(password);

    db.get('SELECT * FROM users WHERE username = ? AND password = ?',
        [username, hashedPassword],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Error during login' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
            res.json({ token });
        });
});

// 영화 관련 라우트
app.get('/api/movies/popular', async (req, res) => {
    try {
        const movies = await tmdbService.getPopularMovies();
        res.json(movies);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching popular movies' });
    }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const movie = await tmdbService.getMovieDetails(req.params.id);
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie details' });
    }
});

app.get('/api/movies/search/:query', async (req, res) => {
    try {
        const movies = await tmdbService.searchMovies(req.params.query);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ error: 'Error searching movies' });
    }
});

// 리뷰 관련 라우트
app.post('/api/reviews', auth, (req, res) => {
    const { movie_id, rating, comment } = req.body;
    const user_id = req.user.id;

    db.run('INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)',
        [user_id, movie_id, rating, comment],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating review' });
            }
            res.status(201).json({ message: 'Review created successfully' });
        });
});

app.get('/api/reviews/:movieId', (req, res) => {
    db.all(`
        SELECT r.*, u.username 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.movie_id = ?
        ORDER BY r.created_at DESC
    `, [req.params.movieId], (err, reviews) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching reviews' });
        }
        res.json(reviews);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 