"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase автоматически обработает hash/query параметры
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          setError(authError.message);
          setTimeout(() => router.push('/auth'), 2000);
          return;
        }

        if (data.session) {
          // Создаем профиль если нужно
          const { data: existingProfile } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.session.user.id)
            .single();

          if (!existingProfile) {
            
            await supabase
              .from("users")
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                username: data.session.user.email?.split("@")[0] || "user",
                is_superuser: false,
                nippies_balance: 0,
                pretty_generations_remaining: 5,
                hot_generations_remaining: 1,
              });
          }

          router.push('/');
        } else {
          setError("No session found");
          setTimeout(() => router.push('/auth'), 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setTimeout(() => router.push('/auth'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)",
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(20px)",
        padding: "40px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "400px",
      }}>
        {error ? (
          <>
            <h2 style={{ color: "#C2185B", marginBottom: "20px" }}>❌ Ошибка авторизации</h2>
            <p style={{ color: "#666" }}>{error}</p>
            <p style={{ color: "#999", marginTop: "20px" }}>Перенаправление...</p>
          </>
        ) : (
          <>
            <div style={{
              width: "50px",
              height: "50px",
              border: "3px solid #C2185B",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }} />
            <h2 style={{ color: "#C2185B", marginBottom: "10px" }}>Завершаем вход...</h2>
            <p style={{ color: "#666" }}>Пожалуйста, подождите</p>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
