// Type exports
export type { Option as AsyncWaveOptions } from './@types';
export type {
  AsyncFunction,
  AsyncChainFunction,
  UnwrapPromise,
  ReturnTypeOf,
} from './@types';

// Class exports
export { PromiseCircularityError } from './utils';
export { AsyncWaveBuilder } from './builder';

// Main function export (with static methods from, of)
export { asyncWave } from './core';
