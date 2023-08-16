import clonedeep from 'lodash.clonedeep';

import type { CallbackFns, Options, StartValue } from './utils/types';
import { createOn, createPromiseRecursiveFn, promisify } from './utils/fn';

/**
 * @see https://github.com/jeongbaebang/async-wave
 * @version 1.5.0
 * @param startVal The first value to be promisified. If the value is not a function or a promise, it will be automatically converted into a function that returns a promise.
 *
 * **Note:** Regardless of the value passed as the first argument, it will always be wrapped in a promise and passed as an argument.
 *
 * @param callbacks An array of callback functions to be executed in the `then` method.
 * @param option (optional): An optional object that provides onError, onSettled, and onSuccess callback functions.
 * @returns A `Promise` object.
 *
 * @example
 * ```typescript
 * // Promisify and execute a sequence of callback functions
 * asyncWave(placeId, [getPlaceDetailResult, createAddress], {
 *   onError: () => {
 *     return mapErrorHandler(location, ErrorType.network);
 *   },
 *   onSuccess: data => {
 *     cache.set(data.place_id, data);
 *   },
 * });
 *
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

function asyncWave<SV, R>(
  startVal: StartValue<SV>,
  callbacks: CallbackFns,
  option?: Options<R>
): Promise<any>;

function asyncWave<R>(
  callbacks: CallbackFns,
  option?: Options<R>
): Promise<any>;

async function asyncWave<SV, R>(
  startValue: StartValue<SV> | CallbackFns,
  callbacks: CallbackFns | Options<R> | undefined,
  option?: Options<R> | undefined
): Promise<any> {
  let clonedArgs;

  if (Array.isArray(startValue)) {
    const startVal = startValue.shift() as StartValue<SV>;
    const callbackOpt =
      !Array.isArray(callbacks) && typeof callbacks === 'object'
        ? callbacks
        : (undefined as Options<R> | undefined);
    clonedArgs = [startVal, ...[startValue, callbackOpt].map(clonedeep)];
  } else {
    clonedArgs = [startValue, callbacks, option].map(clonedeep);
  }

  const firstPromiseFn = promisify(
    typeof startValue === 'object'
      ? (clonedArgs[0] as StartValue<SV>)
      : startValue,
    true
  );
  const promiseRecursiveFn = createPromiseRecursiveFn<R>(
    clonedArgs[1] as CallbackFns
  );
  const options = clonedArgs[2] as Options<R>;
  const onError = createOn.error(options?.onError);
  const onSuccess = createOn.success(options?.onSuccess);
  const onSettled = createOn.settled(options?.onSettled);

  return promiseRecursiveFn(firstPromiseFn())
    .then(onSuccess)
    .catch(onError)
    .finally(onSettled) as Promise<R>;
}

export { asyncWave };
