"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/contexts/LanguageContext";

function AuthPageContent() {
  const { t } = useTranslation('auth');
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  async function handleVerifyCode() {
    if (!verificationCode || !verificationEmail) {
      setError(t('emailPlaceholder') + ' ' + t('enter6DigitCode'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: verificationCode,
        type: 'email',
      });

      if (verifyError) {
        setError(`${verifyError.message}`);
        setLoading(false);
        return;
      }

      setSuccess("✅ Email подтвержден! Переходим на главную...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError("Ошибка при проверке кода");
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!verificationEmail) {
      setError("Введите email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: verificationEmail,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        setError(`Ошибка: ${error.message}`);
      } else {
        setSuccess("✅ Новый код отправлен на почту!");
      }
    } catch (err) {
      setError("Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });

      if (error) {
        setError(`Google вход не удался: ${error.message}`);
        console.error("Google sign in error:", error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(`❌ Ошибка: ${errorMsg}`);
      console.error("Google auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Регистрация через API route
        console.log("📝 Начинаю регистрацию с email:", email);
        
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        const result = await response.json();
        console.log("📡 Response data:", result);

        if (!response.ok) {
          console.error("❌ SignUp error details:", {
            status: response.status,
            error: result.error,
            full: result,
          });
          setError(`Ошибка регистрации: ${result.error}`);
          return;
        }

        console.log("✅ Пользователь создан:", result.user?.id);

        setSuccess("✅ Регистрация успешна! Проверьте свою почту - мы отправили 6-значный код.");
        setShowVerification(true);
        setVerificationEmail(email);
        setEmail("");
        setPassword("");
        setUsername("");
        setLoading(false);
      } else {
        // Вход
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          console.error("SignIn error:", signInError);
          setLoading(false);
          return;
        }

        console.log("✅ Вход успешен");
        setSuccess("✅ Успешный вход!");
        
        // Небольшая задержка чтобы показать сообщение об успехе
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(`❌ ${errorMsg}`);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative Blobs */}
      <div style={{
        position: "fixed",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        top: "-200px",
        left: "-200px",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      
      <div style={{
        position: "fixed",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, #BAE1FF 0%, #BAFFC9 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        bottom: "-150px",
        right: "-150px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Auth Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "50px 40px",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
        width: "100%",
        maxWidth: "420px",
      }}>
        <h1 style={{
          textAlign: "center",
          marginBottom: "12px",
          fontSize: "48px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 700,
          color: "#C2185B",
          letterSpacing: "-0.5px",
        }}>
          Beautify.AI
        </h1>

        <p style={{
          textAlign: "center",
          marginBottom: "35px",
          fontSize: "16px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 400,
          color: "#8B4789",
          lineHeight: "1.5",
        }}>
          {showVerification ? t('enterCode') : t('welcome')}
        </p>

        {error && (
          <div style={{
            color: "#d32f2f",
            marginBottom: "20px",
            padding: "14px 18px",
            background: "rgba(255, 205, 210, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            fontSize: "14px",
            border: "1px solid rgba(211, 47, 47, 0.2)",
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            color: "#2e7d32",
            marginBottom: "20px",
            padding: "14px 18px",
            background: "rgba(200, 230, 201, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            fontSize: "14px",
            border: "1px solid rgba(46, 125, 50, 0.2)",
          }}>
            {success}
          </div>
        )}

        {showVerification ? (
          // Verification Code Form
          <>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px",
                marginBottom: "16px",
                border: "2px solid rgba(26, 26, 26, 0.1)",
                borderRadius: "16px",
                fontSize: "15px",
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(10px)",
                color: "#1A1A1A",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
              }}
            />

            <input
              type="text"
              placeholder={t('enter6DigitCode')}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              style={{
                width: "100%",
                padding: "16px 20px",
                marginBottom: "24px",
                border: "2px solid rgba(26, 26, 26, 0.1)",
                borderRadius: "16px",
                fontSize: "24px",
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(10px)",
                color: "#1A1A1A",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
                textAlign: "center",
                letterSpacing: "8px",
              }}
            />

            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              style={{
                width: "100%",
                padding: "16px",
                background: loading || verificationCode.length !== 6 
                  ? "rgba(194, 24, 91, 0.5)" 
                  : "linear-gradient(135deg, #C2185B 0%, #EC407A 100%)",
                color: "white",
                border: "none",
                borderRadius: "16px",
                cursor: loading || verificationCode.length !== 6 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "1px",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                marginBottom: "12px",
              }}
            >
              {loading ? t('verifying') : t('confirm')}
            </button>

            <button
              onClick={handleResendCode}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#C2185B",
                border: "2px solid #C2185B",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {t('resendCode')}
            </button>

            <button
              onClick={() => {
                setShowVerification(false);
                setVerificationCode("");
                setError(null);
                setSuccess(null);
              }}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "12px",
                background: "transparent",
                color: "#666",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                textDecoration: "underline",
              }}
            >
              {t('backToRegistration')}
            </button>
          </>
        ) : (
          // Login/Signup Form
          <>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px",
            marginBottom: "16px",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "16px",
            fontSize: "15px",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#1A1A1A",
            boxSizing: "border-box",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
          }}
        />

        <input
          type="password"
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px",
            marginBottom: "16px",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "16px",
            fontSize: "15px",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#1A1A1A",
            boxSizing: "border-box",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
          }}
        />

        {isSignUp && (
          <input
            type="text"
            placeholder={t('usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              marginBottom: "16px",
              border: "2px solid rgba(26, 26, 26, 0.1)",
              borderRadius: "16px",
              fontSize: "15px",
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(10px)",
              color: "#1A1A1A",
              boxSizing: "border-box",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
            }}
          />
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "rgba(26, 26, 26, 0.5)" : "#1A1A1A",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            marginTop: "8px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#2A2A2A")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#1A1A1A")}
        >
          {loading ? t('loading') : isSignUp ? t('signup') : t('login')}
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "24px 0",
          gap: "12px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(26, 26, 26, 0.2)" }} />
          <span style={{ color: "#666", fontSize: "13px", fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(26, 26, 26, 0.2)" }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "rgba(255, 255, 255, 0.5)" : "white",
            color: "#1A1A1A",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "white")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? t('loading') : t('loginWithGoogle')}
        </button>

        <div style={{
          textAlign: "center",
          marginTop: "24px",
          fontSize: "14px",
          color: "#666",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>
          {isSignUp ? t('haveAccount') : t('noAccount')}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#C2185B",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              textDecoration: "underline",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#D81B60")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C2185B")}
          >
            {isSignUp ? t('login') : t('signup')}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
