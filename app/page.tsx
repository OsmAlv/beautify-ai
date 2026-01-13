"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female">("female");

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function send() {
    if (!image) {
      setError("Загрузи изображение");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Если это base64, извлекаем только контент без "data:image/..."
      const imageData = image.includes(",") ? image.split(",")[1] : image;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageData, gender }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка обработки");
        return;
      }

      setResult(data.imageUrl);
    } catch (err) {
      setError("Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>🎨 Beautify.AI</h1>
        <p style={styles.subtitle}>Преврати свою фото в 3D персонажа</p>

        <div style={styles.genderSelect}>
          <button
            onClick={() => setGender("female")}
            style={{
              ...styles.genderButton,
              background: gender === "female" ? "#667eea" : "#ddd",
              color: gender === "female" ? "white" : "#333",
            }}
          >
            👩 Женщина
          </button>
          <button
            onClick={() => setGender("male")}
            style={{
              ...styles.genderButton,
              background: gender === "male" ? "#667eea" : "#ddd",
              color: gender === "male" ? "white" : "#333",
            }}
          >
            👨 Мужчина
          </button>
        </div>

        <div style={styles.uploadSection}>
          <label style={styles.label}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.fileInput}
            />
            <div style={styles.uploadBox}>
              <span style={styles.uploadText}>
                {image ? "✓ Изображение загружено" : "📤 Выбери изображение"}
              </span>
            </div>
          </label>
        </div>

        {image && (
          <div style={styles.preview}>
            <h3>Исходное изображение:</h3>
            <img src={image} alt="Preview" style={styles.image} />
          </div>
        )}

        <button
          onClick={send}
          disabled={!image || loading}
          style={{
            ...styles.button,
            opacity: !image || loading ? 0.5 : 1,
            cursor: !image || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Обработка..." : "✨ Преобразовать"}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.result}>
            <h3>Результат:</h3>
            <img src={result} alt="Result" style={styles.image} />
            <div style={styles.resultButtons}>
              <a href={result} download="beautified-image.jpg" style={styles.download}>
                ⬇️ Скачать изображение
              </a>
              <button
                onClick={send}
                disabled={loading}
                style={{
                  ...styles.download,
                  marginLeft: "10px",
                  background: "#764ba2",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "⏳ Переобработка..." : "🔄 Regenerate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    padding: "20px",
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: "25px",
    padding: "50px 40px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2), 0 0 100px rgba(102, 126, 234, 0.15)",
    backdropFilter: "blur(10px)",
  },
  title: {
    fontSize: "3.2em",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "5px",
    textAlign: "center" as const,
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: "1.15em",
    color: "#888",
    textAlign: "center" as const,
    marginBottom: "35px",
    fontWeight: "500",
  },
  genderSelect: {
    display: "flex",
    gap: "12px",
    marginBottom: "30px",
    justifyContent: "center",
  },
  genderButton: {
    padding: "14px 28px",
    fontSize: "1em",
    fontWeight: "600",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  } as React.CSSProperties,
  uploadSection: {
    marginBottom: "25px",
  },
  label: {
    cursor: "pointer",
  },
  fileInput: {
    display: "none",
  },
  uploadBox: {
    border: "2px dashed #667eea",
    borderRadius: "16px",
    padding: "40px 30px",
    textAlign: "center" as const,
    background: "linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%)",
    transition: "all 0.3s ease",
  },
  uploadText: {
    fontSize: "1.15em",
    color: "#667eea",
    fontWeight: "600",
  },
  preview: {
    marginTop: "25px",
    padding: "18px",
    background: "linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%)",
    borderRadius: "16px",
  },
  image: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "12px",
    marginTop: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  },
  button: {
    width: "100%",
    padding: "16px",
    fontSize: "1.1em",
    fontWeight: "700",
    color: "white",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "14px",
    marginTop: "25px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
    cursor: "pointer",
  } as React.CSSProperties,
  error: {
    color: "#e74c3c",
    marginTop: "20px",
    textAlign: "center" as const,
    fontSize: "0.95em",
    fontWeight: "500",
    background: "#fee",
    padding: "12px",
    borderRadius: "12px",
  },
  result: {
    marginTop: "35px",
    padding: "25px",
    background: "linear-gradient(135deg, #e0f7ff 0%, #f0e7ff 100%)",
    borderRadius: "16px",
    textAlign: "center" as const,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },
  resultButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "18px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  download: {
    display: "inline-block",
    marginTop: "15px",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    textDecoration: "none",
    borderRadius: "12px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontWeight: "600",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.25)",
    cursor: "pointer",
  } as React.CSSProperties,
} as const;