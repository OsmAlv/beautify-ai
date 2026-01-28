// Request Queue для последовательной обработки запросов
type QueueTask<T> = () => Promise<T>;

class RequestQueue {
  private queue: Array<{
    task: QueueTask<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private concurrency: number;
  private activeRequests = 0;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }

  async add<T>(task: QueueTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.concurrency) return;
    
    const item = this.queue.shift();
    if (!item) return;

    this.processing = true;
    this.activeRequests++;

    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeRequests--;
      this.processing = false;
      
      // Обрабатываем следующие задачи
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

export const apiQueue = new RequestQueue(3); // Максимум 3 параллельных запроса
