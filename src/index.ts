import clonedeep from 'lodash.clonedeep';

import type { CallbackFns, Options, StartValue } from './utils/types';
import { createOn, createPromiseRecursiveFn, promisify } from './utils/fn';

/**
 * @version 1.2.5
 * @param startValue The first value to be promisified. If the value is not a function or a promise, it will be automatically converted into a function that returns a promise.
 *
 * **Note:** Regardless of the value passed as the first argument, it will always be wrapped in a promise and passed as an argument.
 *
 * @param callbackFns An array of callback functions to be executed in the `then` method.
 * @param option (optional): An optional object that provides onError, onSettled and onSuccess callback functions.
 * @returns A `Promise` object.
 *
 * @example
 * ```typescript
 * vigilAsync(placeId, [getPlaceDetailResult, createAddress], {
 *   onError: () => {
 *     return mapErrorHandler(location, ErrorType.network);
 *   },
 *   onSuccess: data => {
 *     cache.set(data.place_id, data);
 *   },
 * });
 * ```
 */

async function vigilAsync<SV, R>(
  startValue: StartValue<SV>,
  callbackFns: CallbackFns,
  option?: Options<R>
): Promise<R> {
  const args = [startValue, callbackFns, option].map((arg) => clonedeep(arg));
  const firstPromiseFn = promisify(
    typeof startValue === 'object' ? (args[0] as StartValue<SV>) : startValue,
    true
  );
  const promiseRecursiveFn = createPromiseRecursiveFn<R>(
    args[1] as CallbackFns
  );
  const options = args[2] as Options<R>;
  const [onErrorFn, onSuccessFn, onSettledFn] = [
    createOn.error(options?.onError),
    createOn.sucess(options?.onSuccess),
    createOn.settled(option?.onSettled),
  ];

  return promiseRecursiveFn(firstPromiseFn())
    .then(onSuccessFn)
    .catch(onErrorFn)
    .finally(onSettledFn) as Promise<R>;
}

export { vigilAsync };
