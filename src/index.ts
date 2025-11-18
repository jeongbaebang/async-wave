// Type exports
export type { Option as AsyncWaveOptions } from './@types';
export type {
  AsyncFunction,
  AsyncChainFunction,
  UnwrapPromise,
  ReturnTypeOf,
  RetryOptions,
  RetryStrategy,
  CacheOptions,
  ParallelResult,
  Predicate,
  TapFunction,
} from './@types';

// Error class exports
export { PromiseCircularityError } from './utils';
export { TimeoutError, AbortError } from './builder';

// Builder class export
export { AsyncWaveBuilder } from './builder';

// Main function export (with static methods from, of, parallel)
export { asyncWave } from './core';
