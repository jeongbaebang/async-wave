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
} from './types';

export const createOn = {
  error(onError?: OnError) {
    return (error: unknown) => {
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
    return () => {
      if (onBefore) {
        onBefore();
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
  const fns = clonedeep(callbackFns);
  const fnsLength = size(fns);

  return function recursive(
    promise: Promise<unknown>,
    currentIndex = 0,
  ): Promise<R> {
    if (isEqual(currentIndex, fnsLength)) {
      return promise as Promise<R>;
    }

    return recursive(
      nextPromise(promise, fns[currentIndex]),
      nextIndex(currentIndex),
    );
  };
}

export function guard<T extends any[], R>(
  f: (...args: T) => R,
  ef: (error: unknown) => void,
  args: T,
): R | void;

// args를 받지 않는 경우
export function guard<R>(f: () => R, ef: (error: unknown) => void): R | void;

export function guard<T extends any[], R>(
  f: (...args: T | []) => R,
  ef: (error: unknown) => void,
  args?: T,
): R | void {
  try {
    return args ? f(...args) : f();
  } catch (error) {
    ef(error);
  }
}
