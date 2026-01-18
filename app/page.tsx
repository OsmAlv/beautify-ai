"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const images = [
    "/landing-img/1.jpg",
    "/landing-img/2.jpg",
    "/landing-img/3.jpg",
    "/landing-img/4.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-container">
      {/* Декоративные блобы */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Шапка */}
      <header className="header">
        <div className="logo">BEAUTIFY.AI</div>
        <nav className="nav">
          <a href="/" className="nav-link">Главная</a>
        </nav>
      </header>

      {/* Основной контент */}
      <main className="main-content">
        {/* Левая колонка - Фото */}
        <div className="photo-section">
          <div className="photo-card">
            <div className="carousel">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Beauty ${index + 1}`}
                  className={`carousel-image ${index === currentSlide ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="carousel-dots">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка - Текст */}
        <div className="content-section">
          <h1 className="main-title">
            Привет! Я —<br />
            AI-сервис красоты.
          </h1>
          <p className="main-description">
            Мы подчёркиваем твою естественную красоту<br />
            с помощью искусственного интеллекта.
          </p>

          <div className="buttons-group">
            <button className="btn btn-primary liquid-glass-btn-dark" onClick={() => router.push('/editor')}>
              ПОПРОБОВАТЬ
            </button>
            <button className="btn btn-secondary liquid-glass-btn" onClick={() => router.push('/profile')}>
              ПРИМЕРЫ
            </button>
            <button className="btn btn-secondary liquid-glass-btn" onClick={() => router.push('/photoshoot')}>
              ФОТОСЕССИЯ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
