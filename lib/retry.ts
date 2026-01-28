// Retry логика с exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`⚠️ Попытка ${attempt + 1}/${maxRetries} не удалась. Повтор через ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Утилита для безопасного fetch с retry
export async function safeFetch(
  url: string,
  options?: RequestInit,
  retries: number = 3
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    // Если 5xx ошибка - retry
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Если 429 (Too Many Requests) - retry с увеличенной задержкой
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    
    return response;
  }, retries);
}
