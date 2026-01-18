// ============================================
// КАРУСЕЛЬ ФОТОГРАФИЙ
// ============================================

// Конфигурация
const CAROUSEL_CONFIG = {
    autoplayInterval: 3500, // миллисекунды
    transitionDuration: 1000 // миллисекунды
};

// Инициализация
let currentIndex = 0;
let autoplayTimer = null;

// Получаем элементы
const images = document.querySelectorAll('.carousel-image');
const dots = document.querySelectorAll('.dot');

// Функция переключения слайда
function goToSlide(index) {
    // Убираем активный класс у текущего изображения и точки
    images[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');
    
    // Обновляем индекс
    currentIndex = index;
    
    // Добавляем активный класс новому изображению и точке
    images[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
}

// Следующий слайд
function nextSlide() {
    const nextIndex = (currentIndex + 1) % images.length;
    goToSlide(nextIndex);
}

// Предыдущий слайд
function prevSlide() {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    goToSlide(prevIndex);
}

// Запуск автопрокрутки
function startAutoplay() {
    stopAutoplay(); // Останавливаем предыдущий таймер
    autoplayTimer = setInterval(nextSlide, CAROUSEL_CONFIG.autoplayInterval);
}

// Остановка автопрокрутки
function stopAutoplay() {
    if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }
}

// Обработчики кликов по точкам
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToSlide(index);
        startAutoplay(); // Перезапускаем автопрокрутку
    });
});

// Пауза при наведении на карточку
const photoCard = document.querySelector('.photo-card');
if (photoCard) {
    photoCard.addEventListener('mouseenter', stopAutoplay);
    photoCard.addEventListener('mouseleave', startAutoplay);
}

// ============================================
// КЛАВИАТУРНАЯ НАВИГАЦИЯ
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevSlide();
        startAutoplay();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
        startAutoplay();
    }
});

// ============================================
// SWIPE ЖЕСТЫ (для мобильных)
// ============================================
let touchStartX = 0;
let touchEndX = 0;

if (photoCard) {
    photoCard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    photoCard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Свайп влево -> следующий слайд
            nextSlide();
        } else {
            // Свайп вправо -> предыдущий слайд
            prevSlide();
        }
        startAutoplay();
    }
}

// ============================================
// ПЛАВНАЯ АНИМАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ============================================
// ЗАПУСК АВТОПРОКРУТКИ ПРИ ЗАГРУЗКЕ
// ============================================
startAutoplay();

// ============================================
// ОСТАНОВКА ПРИ УХОДЕ СО СТРАНИЦЫ
// ============================================
window.addEventListener('beforeunload', stopAutoplay);

// ============================================
// PAUSE/PLAY ПРИ СМЕНЕ ВКЛАДКИ
// ============================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoplay();
    } else {
        startAutoplay();
    }
});
