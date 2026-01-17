"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
  pretty_generations_remaining: number;
  hot_generations_remaining: number;
}

interface Prompt {
  id: number;
  model: string;
  intensity: string;
  environment: string | null;
  prompt_text: string;
  created_at: string;
  updated_at: string;
}

const ADMIN_EMAIL = "osmanovalev33@gmail.com";
const ADMIN_PASSWORD = "1816424Alev!@";

export default function AdminSecret() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    nippies: "100",
  });

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptFilter, setPromptFilter] = useState({ model: "bytedance", intensity: "pretty" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setEmail("");
      setPassword("");
      await loadUsers();
      await loadPrompts();
    } else {
      setError("❌ Неверный логин или пароль");
    }

    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error: err } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Ошибка при загрузке пользователей");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleMakeSuperuser = async (email: string, isSuperuser: boolean) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "make-superuser",
          email,
          superuser: !isSuperuser,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка");
        return;
      }

      setSuccessMessage(`✅ ${data.message}`);
      await loadUsers();
    } catch (err) {
      console.error("Error:", err);
      setError("Ошибка при изменении статуса");
    }
  };

  const handleAddNippies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.nippies) {
      setError("Заполни все поля");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-nippies",
          email: formData.email,
          nippies: parseInt(formData.nippies),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка");
        return;
      }

      setSuccessMessage(`✅ ${data.message}`);
      await loadUsers();
      setFormData({ email: "", nippies: "100" });
    } catch (err) {
      console.error("Error:", err);
      setError("Ошибка при добавлении nippies");
    }
  };

  const loadPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const response = await fetch("/api/admin/prompts");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setPrompts(data.prompts || []);
    } catch (err) {
      console.error("Error loading prompts:", err);
      setError("Ошибка при загрузке промптов");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-prompt",
          model: editingPrompt.model,
          intensity: editingPrompt.intensity,
          environment: editingPrompt.environment,
          prompt_text: editingPrompt.prompt_text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка");
        return;
      }

      setSuccessMessage("✅ Промпт успешно обновлен!");
      setEditingPrompt(null);
      await loadPrompts();
    } catch (err) {
      console.error("Error:", err);
      setError("Ошибка при сохранении промпта");
    }
  };

  const styles = {
    main: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    } as React.CSSProperties,
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      background: "white",
      borderRadius: "15px",
      padding: "30px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    } as React.CSSProperties,
    loginContainer: {
      maxWidth: "400px",
      margin: "50px auto",
      textAlign: "center" as const,
    } as React.CSSProperties,
    form: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "15px",
    } as React.CSSProperties,
    input: {
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      fontSize: "14px",
    } as React.CSSProperties,
    button: {
      padding: "12px 30px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "16px",
    } as React.CSSProperties,
    error: {
      padding: "15px",
      background: "#fadbd8",
      color: "#e74c3c",
      borderRadius: "5px",
      marginBottom: "20px",
    } as React.CSSProperties,
    success: {
      padding: "15px",
      background: "#d5f4e6",
      color: "#27ae60",
      borderRadius: "5px",
      marginBottom: "20px",
    } as React.CSSProperties,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      borderBottom: "2px solid #eee",
      paddingBottom: "15px",
    } as React.CSSProperties,
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#333",
      margin: "0",
    } as React.CSSProperties,
    section: {
      marginBottom: "40px",
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "15px",
    } as React.CSSProperties,
    formSection: {
      background: "#f9f9f9",
      padding: "20px",
      borderRadius: "10px",
      marginBottom: "20px",
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginTop: "20px",
    } as React.CSSProperties,
    th: {
      background: "#f0f0f0",
      padding: "12px",
      textAlign: "left" as const,
      fontWeight: "bold",
      borderBottom: "2px solid #ddd",
    } as React.CSSProperties,
    td: {
      padding: "12px",
      borderBottom: "1px solid #ddd",
    } as React.CSSProperties,
    badgeSuperuser: {
      background: "#ffd700",
      color: "#333",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "bold",
    } as React.CSSProperties,
    smallButton: {
      padding: "6px 12px",
      fontSize: "12px",
      background: "#667eea",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    } as React.CSSProperties,
    textarea: {
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      fontSize: "13px",
      fontFamily: "monospace",
      minHeight: "150px",
      resize: "vertical" as const,
    } as React.CSSProperties,
    modal: {
      position: "fixed" as const,
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    } as React.CSSProperties,
    modalContent: {
      background: "white",
      padding: "30px",
      borderRadius: "10px",
      maxWidth: "800px",
      width: "90%",
      maxHeight: "80vh",
      overflow: "auto",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
    } as React.CSSProperties,
  };

  // Форма входа
  if (!authenticated) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.loginContainer}>
            <h1 style={styles.title}>🔐 Админ Консоль</h1>
            <p style={{ color: "#666", marginBottom: "30px" }}>
              Введи логин и пароль
            </p>

            {error && <p style={styles.error}>{error}</p>}

            <form onSubmit={handleLogin} style={styles.form}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "⏳ Проверка..." : "🔓 Войти"}
              </button>
            </form>

            <a href="/" style={{ marginTop: "20px", display: "block", color: "#667eea" }}>
              ← Назад на главную
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Админ панель
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔐 Админ Консоль</h1>
          <button
            onClick={() => {
              setAuthenticated(false);
              setEmail("");
              setPassword("");
              setError(null);
            }}
            style={{ ...styles.button, background: "#e74c3c" }}
          >
            🚪 Выход
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {successMessage && <p style={styles.success}>{successMessage}</p>}

        {/* Добавить nippies */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💳 Добавить nippies</h2>
          <div style={styles.formSection}>
            <form onSubmit={handleAddNippies} style={styles.form}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px" }}>
                <input
                  type="email"
                  placeholder="Email пользователя"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Количество nippies"
                  value={formData.nippies}
                  onChange={(e) =>
                    setFormData({ ...formData, nippies: e.target.value })
                  }
                  style={styles.input}
                />
                <button type="submit" style={styles.button}>
                  ➕ Добавить
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Редактирование промптов */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🤖 Редактирование промптов</h2>
          <div style={styles.formSection}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", marginBottom: "15px" }}>
              <select
                value={promptFilter.model}
                onChange={(e) => setPromptFilter({ ...promptFilter, model: e.target.value })}
                style={styles.input}
              >
                <option value="bytedance">ByteDance</option>
                <option value="nanobana">NanoBana</option>
                <option value="salsa">Salsa</option>
              </select>
              <select
                value={promptFilter.intensity}
                onChange={(e) => setPromptFilter({ ...promptFilter, intensity: e.target.value })}
                style={styles.input}
              >
                <option value="pretty">Pretty</option>
                <option value="hot">Hot</option>
                <option value="salsa">Salsa</option>
              </select>
              <button style={styles.button}>🔍 Фильтр</button>
            </div>

            {loadingPrompts ? (
              <p>⏳ Загрузка промптов...</p>
            ) : (
              <div style={{ display: "grid", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                {prompts
                  .filter(
                    (p) =>
                      p.model === promptFilter.model &&
                      p.intensity === promptFilter.intensity
                  )
                  .map((prompt) => (
                    <div
                      key={prompt.id}
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "#f9f9f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>
                          {prompt.model.toUpperCase()} - {prompt.intensity.toUpperCase()}
                        </strong>
                        {prompt.environment && (
                          <span style={{ marginLeft: "10px", color: "#666" }}>
                            ({prompt.environment})
                          </span>
                        )}
                        <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "12px" }}>
                          {prompt.prompt_text.substring(0, 100)}...
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        style={{ ...styles.smallButton, background: "#667eea" }}
                      >
                        ✏️ Редактировать
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Модаль редактирования */}
        {editingPrompt && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3 style={{ marginTop: "0" }}>
                Редактирование: {editingPrompt.model.toUpperCase()} - {editingPrompt.intensity.toUpperCase()}
                {editingPrompt.environment && ` (${editingPrompt.environment})`}
              </h3>
              <textarea
                value={editingPrompt.prompt_text}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })
                }
                style={styles.textarea}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  onClick={handleSavePrompt}
                  style={{ ...styles.button, flex: 1 }}
                >
                  💾 Сохранить
                </button>
                <button
                  onClick={() => setEditingPrompt(null)}
                  style={{ ...styles.button, background: "#e74c3c", flex: 1 }}
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Таблица пользователей */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            👥 Пользователи ({users.length})
          </h2>
          {loadingUsers ? (
            <p>⏳ Загрузка...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>🌶 nippies</th>
                    <th style={styles.th}>💎 Pretty</th>
                    <th style={styles.th}>🔥 Hot</th>
                    <th style={styles.th}>Статус</th>
                    <th style={styles.th}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>
                        {user.is_superuser ? (
                          <span style={{ color: "#f093fb", fontWeight: "bold" }}>
                            ∞ Бесконечно
                          </span>
                        ) : (
                          user.nippies_balance
                        )}
                      </td>
                      <td style={styles.td}>
                        {user.is_superuser ? (
                          <span style={{ color: "#f093fb", fontWeight: "bold" }}>
                            ∞ Бесконечно
                          </span>
                        ) : (
                          user.pretty_generations_remaining
                        )}
                      </td>
                      <td style={styles.td}>
                        {user.is_superuser ? (
                          <span style={{ color: "#f093fb", fontWeight: "bold" }}>
                            ∞ Бесконечно
                          </span>
                        ) : (
                          user.hot_generations_remaining
                        )}
                      </td>
                      <td style={styles.td}>
                        {user.is_superuser && (
                          <span style={styles.badgeSuperuser}>👑 СУПЕР</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() =>
                            handleMakeSuperuser(user.email, user.is_superuser)
                          }
                          style={{
                            ...styles.smallButton,
                            background: user.is_superuser ? "#e74c3c" : "#27ae60",
                          }}
                        >
                          {user.is_superuser ? "❌ Убрать супер" : "✅ Сделать супер"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <a href="/" style={{ marginTop: "20px", display: "block", color: "#667eea" }}>
          ← Назад на главную
        </a>
      </div>
    </main>
  );
}
