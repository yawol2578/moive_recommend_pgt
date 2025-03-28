// 전역 변수
let currentUser = null;
let currentMovieId = null;

// DOM 요소
const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const movieModal = document.getElementById('movieModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    loadPopularMovies();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 검색 버튼 클릭
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchMovies(query);
        }
    });

    // 검색 입력창 엔터
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            }
        }
    });

    // 로그인/회원가입 링크
    document.getElementById('loginLink').addEventListener('click', () => showModal(loginModal));
    document.getElementById('registerLink').addEventListener('click', () => showModal(registerModal));
    document.getElementById('logoutLink').addEventListener('click', logout);

    // 모달 닫기 버튼
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', () => {
            hideAllModals();
        });
    });

    // 폼 제출
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    reviewForm.addEventListener('submit', handleReviewSubmit);
}

// API 호출 함수들
async function loadPopularMovies() {
    try {
        const response = await fetch('http://localhost:3000/api/movies/popular');
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
        console.error('Error loading popular movies:', error);
    }
}

async function searchMovies(query) {
    try {
        const response = await fetch(`http://localhost:3000/api/movies/search/${encodeURIComponent(query)}`);
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
        console.error('Error searching movies:', error);
    }
}

async function loadMovieDetails(movieId) {
    try {
        const response = await fetch(`http://localhost:3000/api/movies/${movieId}`);
        const movie = await response.json();
        displayMovieDetails(movie);
        loadReviews(movieId);
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

async function loadReviews(movieId) {
    try {
        const response = await fetch(`http://localhost:3000/api/reviews/${movieId}`);
        const reviews = await response.json();
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// 인증 관련 함수들
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('token', data.token);
            updateAuthUI();
            hideAllModals();
            loginForm.reset();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            hideAllModals();
            showModal(loginModal);
            registerForm.reset();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('token');
    updateAuthUI();
}

// UI 업데이트 함수들
function displayMovies(movies) {
    moviesGrid.innerHTML = '';
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.release_date.split('-')[0]}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            currentMovieId = movie.id;
            showModal(movieModal);
            loadMovieDetails(movie.id);
        });
        moviesGrid.appendChild(card);
    });
}

function displayMovieDetails(movie) {
    const movieDetails = document.getElementById('movieDetails');
    movieDetails.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <h2>${movie.title}</h2>
        <p>${movie.overview}</p>
        <p>개봉일: ${movie.release_date}</p>
        <p>평점: ${movie.vote_average}/10</p>
    `;
    reviewForm.style.display = currentUser ? 'block' : 'none';
}

function displayReviews(reviews) {
    reviewsList.innerHTML = '';
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        reviewElement.innerHTML = `
            <div class="review-header">
                <span>${review.username}</span>
                <span class="review-rating">${review.rating}점</span>
            </div>
            <p>${review.comment}</p>
            <small>${new Date(review.created_at).toLocaleDateString()}</small>
        `;
        reviewsList.appendChild(reviewElement);
    });
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('리뷰를 작성하려면 로그인이 필요합니다.');
        return;
    }

    const comment = document.getElementById('reviewComment').value;
    const rating = document.getElementById('reviewRating').value;

    try {
        const response = await fetch('http://localhost:3000/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({
                movie_id: currentMovieId,
                rating: parseInt(rating),
                comment
            })
        });

        if (response.ok) {
            reviewForm.reset();
            loadReviews(currentMovieId);
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('리뷰 작성 중 오류가 발생했습니다.');
    }
}

// 유틸리티 함수들
function showModal(modal) {
    hideAllModals();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideAllModals() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    movieModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateAuthUI() {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');

    if (currentUser) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutLink.style.display = 'inline';
    } else {
        loginLink.style.display = 'inline';
        registerLink.style.display = 'inline';
        logoutLink.style.display = 'none';
    }
} 