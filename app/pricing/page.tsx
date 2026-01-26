"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/contexts/LanguageContext";

interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  nippies: number;
  prettyGenerations: number;
  hotGenerations: number;
  features: string[];
  isPopular?: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const { t } = useTranslation('pricing');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: 5,
      currency: "USD",
      nippies: 100,
      prettyGenerations: 5,
      hotGenerations: 2,
      features: [
        "5 Pretty генераций",
        "2 Hot генераций",
        "100 Nippies баланс",
        "Базовая поддержка"
      ]
    },
    {
      name: "Pro",
      price: 15,
      currency: "USD",
      nippies: 350,
      prettyGenerations: 20,
      hotGenerations: 10,
      features: [
        "20 Pretty генераций",
        "10 Hot генераций",
        "350 Nippies баланс",
        "Приоритетная поддержка",
        "Кастомные промпты"
      ],
      isPopular: true
    },
    {
      name: "Ultimate",
      price: 40,
      currency: "USD",
      nippies: 1000,
      prettyGenerations: 100,
      hotGenerations: 50,
      features: [
        "100 Pretty генераций",
        "50 Hot генераций",
        "1000 Nippies баланс",
        "VIP поддержка 24/7",
        "Кастомные промпты",
        "Ранний доступ к новым фичам"
      ]
    }
  ];

  const handlePurchase = async (plan: PricingPlan) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      // Создаем платеж в NOWPayments
      const orderId = `${user.id}:${plan.name}_${plan.nippies}_${plan.prettyGenerations}_${plan.hotGenerations}`;
      
      console.log('🛒 Creating payment for plan:', plan.name);
      
      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: plan.price,
          price_currency: 'usd',
          order_id: orderId,
          order_description: `Beautify.AI - План ${plan.name}`,
        }),
      });

      const data = await response.json();
      
      console.log('📦 Payment response:', data);

      if (response.ok && data.invoice_url) {
        console.log('✅ Redirecting to payment:', data.invoice_url);
        // Перенаправляем на страницу оплаты NOWPayments
        window.location.href = data.invoice_url;
      } else {
        console.error('❌ Payment creation failed:', data);
        alert(`❌ Ошибка создания платежа: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      alert(`❌ Произошла ошибка: ${error}`);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "40px 20px",
    }}>
      {/* Декоративные блобы */}
      <div style={{
        position: "fixed",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        top: "-150px",
        left: "-150px",
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
        bottom: "-100px",
        right: "-100px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <main style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "48px",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#1A1A1A",
            letterSpacing: "-2px",
            margin: "0 0 16px 0",
          }}>
            {t('title')}
          </h1>
          <p style={{
            fontSize: "18px",
            color: "#666",
            maxWidth: "600px",
            margin: "0 auto",
          }}>
            {t('description')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          marginBottom: "60px",
        }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.isPopular 
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.25))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                borderRadius: "24px",
                border: plan.isPopular ? "2px solid #C2185B" : "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: plan.isPopular 
                  ? "0 12px 40px rgba(194, 24, 91, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3) inset"
                  : "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
                padding: "40px 32px",
                position: "relative",
                transform: plan.isPopular ? "scale(1.05)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = plan.isPopular ? "scale(1.08)" : "scale(1.03)";
                (e.currentTarget as HTMLElement).style.boxShadow = plan.isPopular
                  ? "0 20px 60px rgba(194, 24, 91, 0.3), 0 0 40px rgba(194, 24, 91, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3) inset"
                  : "0 12px 40px rgba(0, 0, 0, 0.15), 0 0 30px rgba(194, 24, 91, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.3) inset";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = plan.isPopular ? "scale(1.05)" : "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = plan.isPopular
                  ? "0 12px 40px rgba(194, 24, 91, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3) inset"
                  : "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset";
              }}
            >
              {plan.isPopular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #C2185B 0%, #EC407A 100%)",
                  color: "white",
                  padding: "6px 20px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>
                  Популярный
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  marginBottom: "8px",
                }}>
                  {plan.name}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                  }}>
                    ${plan.price}
                  </span>
                  <span style={{
                    fontSize: "16px",
                    color: "#666",
                  }}>
                    / {t('oneTime')}
                  </span>
                </div>
              </div>

              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 32px 0",
              }}>
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    <span style={{
                      fontSize: "18px",
                      color: "#C2185B",
                    }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan)}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: plan.isPopular
                    ? "linear-gradient(135deg, #C2185B 0%, #EC407A 100%)"
                    : "#1A1A1A",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {user ? t('buyPlan') : t('loginAndBuy')}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
          padding: "40px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "16px",
          }}>
            {t('faqTitle')}
          </h2>
          <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            textAlign: "left",
          }}>
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "8px" }}>
                {t('faq1Q')}
              </h3>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                {t('faq1A')}
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "8px" }}>
                {t('faq2Q')}
              </h3>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                {t('faq2A')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
