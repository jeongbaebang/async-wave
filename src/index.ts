import clonedeep from 'lodash.clonedeep';

import type { CallbackFns, Options, StartValue } from './utils/types';
import { createOn, createPromiseRecursiveFn, promisify } from './utils/fn';

/**
 * @version 1.0.0
 * @param startValue The first value to be promised. If the value is not a function, it will be converted to a promised function using the `promisify` utility function.
 *
 * **Note:** If you pass a function as the first argument and its return value is not a promise, it will raise an error.
 *
 * @param callbackFns An array of callback functions to be executed in the `then` method.
 * @param option An optional object that can be used to provide `onError` and `onSuccess` callback functions.
 *
 * **onError** - A function that will be triggered when the promise reaches the rejected state.
 *
 * **onSuccess** - A function that will be triggered when the promise reaches the resolved state. The result of the last promise will be passed as the argument.
 *
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
  const firstPromiseFn = promisify(startValue);
  const promiseRecursiveFn = createPromiseRecursiveFn<R>(callbackFns);
  const options = clonedeep(option);
  const [onErrorFn, onSuccessFn] = [
    createOn.error(options?.onError),
    createOn.sucess(options?.onSuccess),
  ];

  return promiseRecursiveFn(firstPromiseFn())
    .then(onSuccessFn)
    .catch(onErrorFn) as Promise<R>;
}

export default vigilAsync;
