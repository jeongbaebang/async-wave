import clonedeep from 'lodash.clonedeep';
import size from 'lodash.size';
import add from 'lodash.add';
import isFunction from 'lodash.isfunction';
import isEqual from 'lodash.isequal';
import isPromise from 'is-promise';

import type {
  CallbackFns,
  OnError,
  OnSettled,
  OnSuccess,
  OnBefore,
} from '../@types';

export const createOn = {
  error(onError?: OnError) {
    return (error: PromiseCircularityError) => {
      if (onError) {
        return onError(error);
      }

      throw error;
    };
  },
  success<T>(onSuccess?: OnSuccess<T>) {
    return (received: T) => {
      if (onSuccess) {
        return onSuccess(clonedeep(received));
      }

      return clonedeep(received);
    };
  },
  settled(onSettled?: OnSettled) {
    return () => {
      if (onSettled) {
        onSettled();
      }
    };
  },
  before(onBefore?: OnBefore) {
    return async () => {
      if (onBefore) {
        try {
          await onBefore();
        } catch (error) {
          return Promise.reject(error); // 에러가 상위 프로미스 체인에 제대로 전파하도록 처리
        }
      }
    };
  },
};

export function nextIndex(currentIndex: number) {
  const ONE = 1;

  return add(currentIndex, ONE);
}

export function promisify<T>(
  target: T | (() => Promise<T>) | (() => T),
  convertFn = false,
): (arg?: unknown) => Promise<T> {
  if (!isFunction(target)) {
    return async () => target;
  }

  // 함수인데 프로미스가 아닌경우
  if (convertFn && !isPromise(target)) {
    const asyncFn = () => {
      return new Promise((resolve) => {
        resolve(target());
      });
    };

    return asyncFn as () => Promise<T>;
  }

  return target as () => Promise<T>;
}

export function nextPromise<T>(
  promise: Promise<T>,
  nextFn: ((value: unknown) => unknown) | undefined,
) {
  return promise.then(nextFn);
}

export function createPromiseRecursiveFn<R>(callbackFns: CallbackFns) {
  const FIRST_PROMISE = 0;
  const fns = clonedeep(callbackFns);
  const fnsLength = size(fns);

  return function recursive(
    promise: Promise<unknown>,
    currentIndex = FIRST_PROMISE,
  ): Promise<R> {
    if (isEqual(currentIndex, fnsLength)) {
      return promise as Promise<R>;
    }

    return recursive(
      nextPromise(promise, fns[currentIndex]).catch((error: unknown) => {
        throw new PromiseCircularityError(
          error instanceof Error ? error.message : 'Promise Circularity Error',
        );
      }),
      nextIndex(currentIndex),
    );
  };
}

export class PromiseCircularityError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = 'PromiseCircularityError';
  }
}

// export function guard<T extends any[], R>(
//   f: (...args: T) => R,
//   ef: (error: unknown) => void,
//   args: T,
// ): R | Error;

// // args를 받지 않는 경우
// export function guard<R>(f: () => R, ef: (error: unknown) => void): R | Error;

// export function guard<T extends any[], R>(
//   f: (...args: T | []) => R,
//   ef: (error: unknown) => void,
//   args?: T,
// ) {
//   try {
//     return args ? f(...args) : f();
//   } catch (error) {
//     ef(error);
//     return new Error();
//   }
// }
