import clonedeep from 'lodash.clonedeep';

import type { CallbackFns, Options } from '../@types';
import { createOn, createPromiseRecursiveFn, promisify } from '../utils';
import { AsyncWaveBuilder } from '../builder';

/**
 * @see https://github.com/jeongbaebang/async-wave
 * @param callbackFns An array of callback functions to be executed in the `then` method.
 * @param option (optional): An optional object that provides onBefore, onError, onSettled, and onSuccess callback functions.
 * @returns `Promise` object.
 * @example
 * ```typescript
 * // Traditional usage
 * asyncWave([placeId, getPlaceDetailResult, createAddress], {
 *   onError: () => {
 *     return mapErrorHandler(location, ErrorType.network);
 *   },
 *   onSuccess: data => {
 *     cache.set(data.place_id, data);
 *   },
 * });
 *
 * // Method chaining usage
 * asyncWave.from(placeId)
 *   .then(getPlaceDetailResult)
 *   .then(createAddress)
 *   .onSuccess(data => cache.set(data.place_id, data))
 *   .onError(() => mapErrorHandler(location, ErrorType.network))
 *   .execute();
 * ```
 */

async function asyncWave<R>(
  _callbackFns: CallbackFns,
  _option?: Options<R> | undefined,
): Promise<R> {
  // 1. 시작 값과 옵션을 분리
  const callbackFns = [..._callbackFns];
  const callbackOptions =
    !Array.isArray(_option) && typeof _option === 'object'
      ? _option
      : undefined;
  const clonedArgs = [
    callbackFns.shift(),
    ...[callbackFns, callbackOptions].map(clonedeep),
  ];
  // 2. 옵션 콜백 함수 설정
  const options = clonedArgs[2] as Options<R>;
  const onError = createOn.error(options?.onError);
  const onSuccess = createOn.success(options?.onSuccess);
  const onSettled = createOn.settled(options?.onSettled);
  const onBeforeStart = createOn.before(options?.onBefore);
  // 3. 재귀적 프라미스 함수 실행
  const startPromiseRecursiveFn = () => {
    const shouldConvertPromise = true;
    // 4. 첫 번째 프라미스 생성
    const firstPromise = promisify(clonedArgs[0], shouldConvertPromise)();
    // 5. 재귀적으로 수행할 프라미스 함수를 생성
    const promiseRecursiveFn = createPromiseRecursiveFn<R>(
      clonedArgs[1] as CallbackFns,
    );

    return promiseRecursiveFn(firstPromise);
  };

  // 6. 프라미스 체인 실행
  return Promise.resolve()
    .then(onBeforeStart)
    .then(startPromiseRecursiveFn)
    .then(onSuccess)
    .catch(onError)
    .finally(onSettled) as Promise<R>;
}

// Add static method for builder pattern
namespace asyncWave {
  /**
   * Create a new AsyncWaveBuilder with the given initial value
   * @param value - The initial value to start the chain (can be a value, Promise, or function)
   * @returns A new AsyncWaveBuilder instance
   * @example
   * ```typescript
   * asyncWave.from(10)
   *   .then(x => x + 5)
   *   .then(x => x * 2)
   *   .onSuccess(result => console.log(result))
   *   .execute();
   * ```
   */
  export function from<T>(
    value: T | Promise<T> | (() => T) | (() => Promise<T>),
  ): AsyncWaveBuilder<T> {
    return new AsyncWaveBuilder<T>(value);
  }

  /**
   * Alias for from() - create a new AsyncWaveBuilder
   * @param value - The initial value to start the chain (can be a value, Promise, or function)
   * @returns A new AsyncWaveBuilder instance
   */
  export function of<T>(
    value: T | Promise<T> | (() => T) | (() => Promise<T>),
  ): AsyncWaveBuilder<T> {
    return new AsyncWaveBuilder<T>(value);
  }

  /**
   * Execute multiple promises in parallel
   * @param promises - Array of promises or values to execute in parallel
   * @returns Promise that resolves with array of results
   * @example
   * ```typescript
   * const [user, posts, comments] = await asyncWave.parallel([
   *   fetchUser(userId),
   *   fetchPosts(userId),
   *   fetchComments(userId)
   * ])
   * ```
   */
  export function parallel<T extends readonly unknown[]>(
    promises: T,
  ): Promise<import('../@types').ParallelResult<T>> {
    return AsyncWaveBuilder.parallel(promises);
  }

  /**
   * Clear the global cache
   */
  export function clearCache(): void {
    AsyncWaveBuilder.clearCache();
  }
}

export { asyncWave };
