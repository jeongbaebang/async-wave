import type { OnError, OnSuccess, OnSettled, OnBefore } from '../@types';
import { asyncWave as coreAsyncWave } from '../core';

/**
 * Builder class for creating async wave chains with method chaining
 * @example
 * ```typescript
 * asyncWave.from(value)
 *   .then(fn1)
 *   .then(fn2)
 *   .onSuccess(result => console.log(result))
 *   .onError(error => console.error(error))
 *   .execute();
 * ```
 */
export class AsyncWaveBuilder<T = unknown> {
  private callbacks: any[] = [];
  private beforeHook?: OnBefore;
  private successHook?: OnSuccess<T>;
  private errorHook?: OnError;
  private settledHook?: OnSettled;

  constructor(private initialValue: any) {
    this.callbacks = [initialValue];
  }

  /**
   * Add a callback function to the chain
   * @param fn - Function to execute in the chain
   * @returns The builder instance for chaining
   */
  then<R>(fn: (value: T) => R | Promise<R>): AsyncWaveBuilder<R> {
    this.callbacks.push(fn);
    return this as unknown as AsyncWaveBuilder<R>;
  }

  /**
   * Add multiple callback functions at once
   * @param fns - Functions to execute in sequence
   * @returns The builder instance for chaining
   */
  pipe<R>(...fns: Array<(value: any) => any>): AsyncWaveBuilder<R> {
    this.callbacks.push(...fns);
    return this as unknown as AsyncWaveBuilder<R>;
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
   * Execute the async wave chain
   * @returns Promise that resolves with the final result
   */
  execute(): Promise<T> {
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
}
