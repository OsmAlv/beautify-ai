// Rate Limiter для контроля частоты запросов
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Удаляем старые запросы
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.warn(`⏳ Rate limit достигнут. Ожидание ${Math.ceil(waitTime / 1000)}s`);
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.checkLimit())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

export const apiRateLimiter = new RateLimiter(10, 60000); // 10 запросов в минуту
export const userRateLimiter = new RateLimiter(3, 10000); // 3 запроса за 10 секунд на пользователя
