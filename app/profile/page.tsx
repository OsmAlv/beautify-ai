"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import styles from "./profile.module.css";

interface Generation {
  id: string;
  mode: "pretty" | "hot" | "salsa";
  environment: string;
  cost: number;
  created_at: string;
  image_url?: string;
  original_image_url?: string;
  age_days?: number;
  is_expired?: boolean;
  error?: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
  pretty_generations_remaining: number;
  hot_generations_remaining: number;
}

interface UserProfile {
  id: string;
  email: string;
}

const modeColors = {
  pretty: "#FF69B4",
  hot: "#FF6B35",
  salsa: "#FF1744",
};

const modeLabels = {
  pretty: "Pretty",
  hot: "Hot",
  salsa: "Salsa",
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      setUser({ id: session.user.id, email: session.user.email || "" });

      // Получаем данные пользователя из таблицы users
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserData(profile);
      }

      // Получаем историю генераций
      const { data: gens } = await supabase
        .from("generation_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (gens) {
        setGenerations(gens);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleViewImage = async (gen: Generation) => {
    setImageLoading(true);
    try {
      const response = await fetch(`/api/generations/${gen.id}`);
      const data = await response.json();

      setSelectedGen({
        ...gen,
        ...data,
        is_expired: data.status === "expired",
        error: data.error,
      });
    } catch {
      setSelectedGen({
        ...gen,
        error: "Не удалось загрузить изображение",
      });
    }
    setImageLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Мой профиль</h1>
            <p className={styles.email}>{user?.email}</p>
          </div>
          <Link href="/" className={styles.backButton}>
            ← На главную
          </Link>
        </div>
      </div>

      {/* Stats */}
      {userData && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>🌶 Баланс</div>
            <div className={styles.statValue}>{userData.nippies_balance}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>🎀 Pretty (осталось)</div>
            <div className={styles.statValue}>
              {userData.pretty_generations_remaining}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>🔥 Hot (осталось)</div>
            <div className={styles.statValue}>
              {userData.hot_generations_remaining}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>📊 Всего генераций</div>
            <div className={styles.statValue}>{generations.length}</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={styles.content}>
        {/* Generations List */}
        <div className={styles.generationsSection}>
          <h2>История генераций</h2>

          {generations.length === 0 ? (
            <div className={styles.emptyState}>
              <p>У вас ещё нет генераций</p>
              <Link href="/" className={styles.ctaButton}>
                Начать создавать
              </Link>
            </div>
          ) : (
            <div className={styles.generationsGrid}>
              {generations.map((gen) => (
                <div key={gen.id} className={styles.generationCard}>
                  {/* Thumbnail placeholder */}
                  <div
                    className={styles.thumbnail}
                    style={{
                      backgroundColor: `${modeColors[gen.mode]}20`,
                      borderColor: modeColors[gen.mode],
                    }}
                  >
                    <div className={styles.thumbnailOverlay}>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewImage(gen)}
                        disabled={imageLoading}
                      >
                        {imageLoading ? "⏳" : "👁️ Просмотр"}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    <div className={styles.modeTag} style={{ color: modeColors[gen.mode] }}>
                      {modeLabels[gen.mode]}
                    </div>
                    {gen.environment && gen.environment !== "original" && (
                      <div className={styles.envTag}>{gen.environment}</div>
                    )}
                    <div className={styles.date}>{formatDate(gen.created_at)}</div>
                    {gen.cost > 0 && (
                      <div className={styles.cost}>Стоимость: {gen.cost} 🌶</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Viewer Modal */}
        {selectedGen && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedGen(null)}
              >
                ✕
              </button>

              <div className={styles.modalBody}>
                {selectedGen.is_expired ? (
                  <div className={styles.expiredMessage}>
                    <div className={styles.expiredIcon}>⏰</div>
                    <h3>Изображение удалено</h3>
                    <p>
                      Wavespeed API хранит изображения только 7 дней. Эта генерация
                      была создана {selectedGen.age_days} дней назад и больше не доступна.
                    </p>
                    {selectedGen.original_image_url && (
                      <div className={styles.originalSection}>
                        <p className={styles.sectionLabel}>Оригинальное изображение:</p>
                        <img
                          src={selectedGen.original_image_url}
                          alt="Original"
                          className={styles.originalImage}
                        />
                      </div>
                    )}
                  </div>
                ) : selectedGen.error ? (
                  <div className={styles.errorMessage}>
                    <div className={styles.errorIcon}>❌</div>
                    <h3>Ошибка загрузки</h3>
                    <p>{selectedGen.error}</p>
                    {selectedGen.original_image_url && (
                      <div className={styles.originalSection}>
                        <p className={styles.sectionLabel}>Оригинальное изображение:</p>
                        <img
                          src={selectedGen.original_image_url}
                          alt="Original"
                          className={styles.originalImage}
                        />
                      </div>
                    )}
                  </div>
                ) : selectedGen.image_url ? (
                  <div className={styles.imageWrapper}>
                    <img
                      src={selectedGen.image_url}
                      alt="Generated"
                      className={styles.fullImage}
                    />
                    <div className={styles.imageInfo}>
                      <p>
                        <strong>Режим:</strong> {modeLabels[selectedGen.mode]}
                      </p>
                      {selectedGen.environment && (
                        <p>
                          <strong>Окружение:</strong> {selectedGen.environment}
                        </p>
                      )}
                      <p>
                        <strong>Дата:</strong> {formatDate(selectedGen.created_at)}
                      </p>
                      {selectedGen.age_days !== undefined && (
                        <p>
                          <strong>Возраст:</strong> {selectedGen.age_days} дней назад
                        </p>
                      )}
                      {selectedGen.original_image_url && (
                        <a
                          href={selectedGen.original_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadLink}
                        >
                          📥 Скачать оригинал
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingMessage}>⏳ Загрузка...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
