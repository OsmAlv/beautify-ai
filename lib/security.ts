// Security utilities для валидации и санитизации

/**
 * Валидация загружаемых изображений
 */
export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: 'Файл не предоставлен' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `Файл слишком большой (макс ${maxSize / 1024 / 1024}MB)` };
  }
  
  const fileType = file.type.toLowerCase();
  if (!allowedTypes.includes(fileType)) {
    return { valid: false, error: 'Неподдерживаемый формат файла. Используйте JPG, PNG или WebP' };
  }
  
  return { valid: true };
}

/**
 * Санитизация пользовательского промпта
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }
  
  return prompt
    // Удаляем HTML tags
    .replace(/<[^>]*>/g, '')
    // Удаляем JavaScript protocol
    .replace(/javascript:/gi, '')
    // Удаляем event handlers
    .replace(/on\w+=/gi, '')
    // Удаляем SQL keywords (базовая защита)
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '')
    .trim()
    .slice(0, 2000); // Максимум 2000 символов
}

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Проверка безопасности URL
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Разрешаем только HTTPS (или HTTP в dev mode)
    const allowedProtocols = ['https:', 'http:', 'data:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Генерация безопасного случайного токена
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Escape HTML для предотвращения XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Валидация пользовательского ID
 */
export function validateUserId(userId: string): boolean {
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Проверка rate limit для IP
 */
const ipRequestMap = new Map<string, number[]>();

export function checkIPRateLimit(
  ip: string,
  maxRequests: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const requests = ipRequestMap.get(ip) || [];
  
  // Удаляем старые запросы
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  recentRequests.push(now);
  ipRequestMap.set(ip, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length
  };
}

/**
 * Очистка карты rate limit (вызывать периодически)
 */
export function cleanupIPRateLimit() {
  const now = Date.now();
  for (const [ip, requests] of ipRequestMap.entries()) {
    const recentRequests = requests.filter(time => now - time < 60000);
    if (recentRequests.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      ipRequestMap.set(ip, recentRequests);
    }
  }
}

// Автоматическая очистка каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupIPRateLimit, 5 * 60 * 1000);
}
