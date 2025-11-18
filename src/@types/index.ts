import type { PromiseCircularityError } from '../utils';

export type OnError = (error: PromiseCircularityError) => void;

export type OnSuccess<T> = (received: T) => void | T | any;

export type OnSettled = () => void;

export type OnBefore = () => Promise<void>;

export interface Option<T> {
  onError: OnError;
  onSuccess: OnSuccess<T>;
  onSettled: OnSettled;
  onBefore: OnBefore;
}

export type StartValue<SV> =
  | Exclude<SV, () => any>
  | (() => Promise<SV>)
  | (() => SV);

export type CallbackFns = any[];

export type Options<R> = Partial<Option<R>>;

// Builder pattern types
export type AsyncFunction<T = any, R = any> = (value: T) => R | Promise<R>;

export type AsyncChainFunction = AsyncFunction<any, any>;

// Helper type to extract the return type of a function (unwrapping Promise)
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Helper type for function return type
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R
  ? UnwrapPromise<R>
  : T;

// Advanced feature types

/**
 * Retry strategy options
 */
export type RetryStrategy = 'linear' | 'exponential';

/**
 * Retry configuration
 */
export interface RetryOptions {
  /** Number of retry attempts */
  times?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Retry strategy: 'linear' or 'exponential' */
  strategy?: RetryStrategy;
  /** Maximum delay for exponential backoff in milliseconds */
  maxDelay?: number;
  /** Custom condition to determine if should retry */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Cache configuration
 */
export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Cache key generator function */
  key?: (...args: any[]) => string;
}

/**
 * Parallel execution result
 */
export type ParallelResult<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};

/**
 * Condition predicate function
 */
export type Predicate<T> = (value: T) => boolean | Promise<boolean>;

/**
 * Tap function for side effects (return value is ignored)
 */
export type TapFunction<T> = (value: T) => any;
