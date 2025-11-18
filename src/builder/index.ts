import type {
  OnError,
  OnSuccess,
  OnSettled,
  OnBefore,
  RetryOptions,
  CacheOptions,
  Predicate,
  TapFunction,
  ParallelResult,
} from '../@types';
import { asyncWave as coreAsyncWave } from '../core';

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Abort error class
 */
export class AbortError extends Error {
  constructor(message = 'Operation aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

/**
 * Simple in-memory cache
 */
class SimpleCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  set(key: string, value: any, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

const globalCache = new SimpleCache();

/**
 * Builder class for creating async wave chains with method chaining and advanced features
 * @example
 * ```typescript
 * asyncWave.from(value)
 *   .then(fn1)
 *   .retry(3, { delay: 1000 })
 *   .timeout(5000)
 *   .tap(x => console.log(x))
 *   .execute();
 * ```
 */
export class AsyncWaveBuilder<T = unknown> {
  private callbacks: any[] = [];
  private beforeHook?: OnBefore;
  private successHook?: OnSuccess<T>;
  private errorHook?: OnError;
  private settledHook?: OnSettled;
  private abortController: AbortController | null = null;
  private retryConfig: RetryOptions | null = null;
  private timeoutMs: number | null = null;
  private delayMs: number | null = null;
  private fallbackValue: T | null = null;
  private hasFallback = false;
  private cacheConfig: CacheOptions | null = null;
  private cacheKey: string | null = null;

  constructor(private initialValue: any) {
    this.callbacks = [initialValue];
    this.abortController = new AbortController();
  }

  /**
   * Add a callback function to the chain
   * @param fn - Function to execute in the chain
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(10).then(x => x * 2).execute()
   * ```
   */
  then<R>(fn: (value: T) => R | Promise<R>): AsyncWaveBuilder<R> {
    this.callbacks.push(fn);
    return this as unknown as AsyncWaveBuilder<R>;
  }

  /**
   * Add multiple callback functions at once
   * @param fns - Functions to execute in sequence
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(10).pipe(add5, multiply2, subtract3).execute()
   * ```
   */
  pipe<R>(...fns: Array<(value: any) => any>): AsyncWaveBuilder<R> {
    this.callbacks.push(...fns);
    return this as unknown as AsyncWaveBuilder<R>;
  }

  /**
   * Retry the operation if it fails
   * @param times - Number of retry attempts (default: 3)
   * @param options - Retry configuration options
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * // Linear retry: 3 attempts, 1 second delay
   * asyncWave.from(url).then(fetch).retry(3, { delay: 1000 }).execute()
   *
   * // Exponential backoff: delays of 1s, 2s, 4s, 8s, 16s (max 10s)
   * asyncWave.from(url)
   *   .then(fetch)
   *   .retry(5, { strategy: 'exponential', delay: 1000, maxDelay: 10000 })
   *   .execute()
   * ```
   */
  retry(times = 3, options: Omit<RetryOptions, 'times'> = {}): this {
    this.retryConfig = { times, ...options };
    return this;
  }

  /**
   * Set a timeout for the operation
   * @param ms - Timeout in milliseconds
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(query)
   *   .then(searchDatabase)
   *   .timeout(5000)
   *   .catch(err => {
   *     if (err instanceof TimeoutError) {
   *       console.log('Operation timed out')
   *     }
   *   })
   *   .execute()
   * ```
   */
  timeout(ms: number): this {
    this.timeoutMs = ms;
    return this;
  }

  /**
   * Execute a side effect without modifying the value
   * @param fn - Function to execute for side effects
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(data)
   *   .tap(x => console.log('Step 1:', x))
   *   .then(transform)
   *   .tap(x => console.log('Step 2:', x))
   *   .execute()
   * ```
   */
  tap(fn: TapFunction<T>): this {
    this.callbacks.push(async (value: T) => {
      await fn(value);
      return value;
    });
    return this;
  }

  /**
   * Debug helper - logs the value with an optional label
   * @param label - Optional label for the debug output
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(10)
   *   .debug('Initial')
   *   .then(x => x * 2)
   *   .debug('After multiply')
   *   .execute()
   * // Output: [AsyncWave Debug] Initial: 10
   * // Output: [AsyncWave Debug] After multiply: 20
   * ```
   */
  debug(label?: string): this {
    return this.tap((value) => {
      const prefix = '[AsyncWave Debug]';
      const message = label ? `${prefix} ${label}:` : `${prefix}`;
      console.log(message, value);
    });
  }

  /**
   * Delay execution by specified milliseconds
   * @param ms - Delay in milliseconds
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(message)
   *   .delay(2000)
   *   .then(sendMessage)
   *   .execute()
   * ```
   */
  delay(ms: number): this {
    this.delayMs = ms;
    return this;
  }

  /**
   * Conditionally execute a function
   * @param condition - Predicate function or boolean
   * @param fn - Function to execute if condition is true
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(user)
   *   .when(u => u.isPremium, sendWelcomeEmail)
   *   .execute()
   * ```
   */
  when<R>(
    condition: Predicate<T> | boolean,
    fn: (value: T) => R | Promise<R>,
  ): AsyncWaveBuilder<T | R> {
    this.callbacks.push(async (value: T) => {
      const shouldExecute =
        typeof condition === 'function' ? await condition(value) : condition;

      if (shouldExecute) {
        return fn(value);
      }
      return value;
    });
    return this as unknown as AsyncWaveBuilder<T | R>;
  }

  /**
   * Conditionally execute a function (opposite of when)
   * @param condition - Predicate function or boolean
   * @param fn - Function to execute if condition is false
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(user)
   *   .unless(u => u.verified, requestVerification)
   *   .execute()
   * ```
   */
  unless<R>(
    condition: Predicate<T> | boolean,
    fn: (value: T) => R | Promise<R>,
  ): AsyncWaveBuilder<T | R> {
    return this.when(
      async (value: T) => {
        const result =
          typeof condition === 'function' ? await condition(value) : condition;
        return !result;
      },
      fn,
    );
  }

  /**
   * Provide a fallback value in case of error
   * @param defaultValue - Value to return on error
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(userId)
   *   .then(fetchUser)
   *   .fallback({ id: 0, name: 'Guest' })
   *   .execute()
   * ```
   */
  fallback<F = T>(defaultValue: F): AsyncWaveBuilder<T | F> {
    this.fallbackValue = defaultValue as any;
    this.hasFallback = true;
    return this as any;
  }

  /**
   * Cache the result of the operation
   * @param ttl - Time to live in milliseconds (default: 60000 = 1 minute)
   * @param options - Cache configuration options
   * @returns The builder instance for chaining
   * @example
   * ```typescript
   * asyncWave.from(userId)
   *   .then(expensiveOperation)
   *   .cache(60000) // Cache for 1 minute
   *   .execute()
   * ```
   */
  cache(ttl = 60000, options: Omit<CacheOptions, 'ttl'> = {}): this {
    this.cacheConfig = { ttl, ...options };
    // Generate cache key from initial value
    this.cacheKey = this.cacheConfig.key
      ? this.cacheConfig.key(this.initialValue)
      : `asyncwave_${JSON.stringify(this.initialValue)}`;
    return this;
  }

  /**
   * Set the before hook - executes before the chain starts
   * @param fn - Async function to execute before chain
   * @returns The builder instance for chaining
   */
  before(fn: OnBefore): this {
    this.beforeHook = fn;
    return this;
  }

  /**
   * Set the success hook - executes when chain completes successfully
   * @param fn - Function to execute on success
   * @returns The builder instance for chaining
   */
  onSuccess(fn: OnSuccess<T>): this {
    this.successHook = fn;
    return this;
  }

  /**
   * Set the error hook - executes when an error occurs
   * @param fn - Function to execute on error
   * @returns The builder instance for chaining
   */
  onError(fn: OnError): this {
    this.errorHook = fn;
    return this;
  }

  /**
   * Alias for onError - provides Promise-like API
   * @param fn - Function to execute on error
   * @returns The builder instance for chaining
   */
  catch(fn: OnError): this {
    return this.onError(fn);
  }

  /**
   * Set the settled hook - executes when chain completes (success or error)
   * @param fn - Function to execute when settled
   * @returns The builder instance for chaining
   */
  onSettled(fn: OnSettled): this {
    this.settledHook = fn;
    return this;
  }

  /**
   * Alias for onSettled - provides Promise-like API
   * @param fn - Function to execute when settled
   * @returns The builder instance for chaining
   */
  finally(fn: OnSettled): this {
    return this.onSettled(fn);
  }

  /**
   * Abort the ongoing operation
   * @example
   * ```typescript
   * const wave = asyncWave.from(query).then(longTask).execute()
   * // Later...
   * wave.abort()
   * ```
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Execute the async wave chain
   * @returns Promise that resolves with the final result
   */
  async execute(): Promise<T> {
    // Check cache first
    if (this.cacheConfig && this.cacheKey) {
      const cached = globalCache.get(this.cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Check if aborted
    if (this.abortController?.signal.aborted) {
      throw new AbortError();
    }

    // Apply delay if configured
    if (this.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs!));
    }

    // Setup retry wrapper
    const executeWithRetry = async (): Promise<T> => {
      if (!this.retryConfig) {
        return this.executeCore();
      }

      const { times = 3, delay = 0, strategy = 'linear', maxDelay } =
        this.retryConfig;
      let lastError: any;

      for (let attempt = 0; attempt <= times; attempt++) {
        try {
          // Check abort before each attempt
          if (this.abortController?.signal.aborted) {
            throw new AbortError();
          }

          return await this.executeCore();
        } catch (error) {
          lastError = error;

          // Don't retry if aborted
          if (error instanceof AbortError) {
            throw error;
          }

          // Check custom retry condition
          if (
            this.retryConfig.shouldRetry &&
            !this.retryConfig.shouldRetry(error, attempt)
          ) {
            throw error;
          }

          // Don't delay on last attempt
          if (attempt < times) {
            let retryDelay = delay;

            if (strategy === 'exponential') {
              retryDelay = Math.min(
                delay * Math.pow(2, attempt),
                maxDelay || Infinity,
              );
            }

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      throw lastError;
    };

    // Setup timeout wrapper
    const executeWithTimeout = async (): Promise<T> => {
      if (!this.timeoutMs) {
        return executeWithRetry();
      }

      return Promise.race([
        executeWithRetry(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new TimeoutError(
                  `Operation timed out after ${this.timeoutMs}ms`,
                  this.timeoutMs!,
                ),
              ),
            this.timeoutMs!,
          ),
        ),
      ]);
    };

    try {
      const result = await executeWithTimeout();

      // Cache the result
      if (this.cacheConfig && this.cacheKey && this.cacheConfig.ttl) {
        globalCache.set(this.cacheKey, result, this.cacheConfig.ttl);
      }

      return result;
    } catch (error) {
      // Use fallback if available
      if (this.hasFallback) {
        return this.fallbackValue!;
      }
      throw error;
    }
  }

  /**
   * Core execution logic (called by execute with retry/timeout wrappers)
   */
  private async executeCore(): Promise<T> {
    return coreAsyncWave<T>(this.callbacks, {
      onBefore: this.beforeHook,
      onSuccess: this.successHook,
      onError: this.errorHook,
      onSettled: this.settledHook,
    });
  }

  /**
   * Execute and return the promise (alias for execute)
   * Allows using await directly without calling execute()
   * @returns Promise that resolves with the final result
   */
  run(): Promise<T> {
    return this.execute();
  }

  /**
   * Static method to execute multiple promises in parallel
   * @param promises - Array of promises or values to execute in parallel
   * @returns Promise that resolves with array of results
   * @example
   * ```typescript
   * const results = await AsyncWaveBuilder.parallel([
   *   fetchUser(userId),
   *   fetchPosts(userId),
   *   fetchComments(userId)
   * ])
   * const [user, posts, comments] = results
   * ```
   */
  static async parallel<T extends readonly unknown[]>(
    promises: T,
  ): Promise<ParallelResult<T>> {
    return Promise.all(promises) as Promise<ParallelResult<T>>;
  }

  /**
   * Clear the global cache
   */
  static clearCache(): void {
    globalCache.clear();
  }
}
