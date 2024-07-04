import clonedeep from 'lodash.clonedeep';

import type { CallbackFns, Options } from '../@types';
import { createOn, createPromiseRecursiveFn, promisify } from '../utils';

/**
 * @see https://github.com/jeongbaebang/async-wave
 * @param callbackFns An array of callback functions to be executed in the `then` method.
 * @param option (optional): An optional object that provides onBefore, onError, onSettled, and onSuccess callback functions.
 * @returns `Promise` object.
 * @example
 * ```typescript
 * asyncWave([placeId, getPlaceDetailResult, createAddress], {
 *   onError: () => {
 *     return mapErrorHandler(location, ErrorType.network);
 *   },
 *   onSuccess: data => {
 *     cache.set(data.place_id, data);
 *   },
 * });
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

export { asyncWave };
