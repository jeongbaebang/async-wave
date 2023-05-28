import clonedeep from 'lodash.clonedeep';
import size from 'lodash.size';
import add from 'lodash.add';
import isFunction from 'lodash.isfunction';
import isEqual from 'lodash.isequal';
import isPromise from 'is-promise';

import type { CallbackFns, OnError, OnSettled, OnSuccess } from './types';

export const createOn = {
  error(onError?: OnError) {
    return (error: Error) => {
      if (onError) {
        return onError(error);
      }

      throw error;
    };
  },
  sucess<T>(onSuccess?: OnSuccess<T>) {
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
};

export function nextIndex(currentIndex: number) {
  const ONE = 1;

  return add(currentIndex, ONE);
}

export function promisify<T>(
  target: T | (() => Promise<T>) | (() => T),
  convertFn = false
): () => Promise<T> {
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
  nextFn: ((value: any) => any) | undefined
) {
  return promise.then(nextFn);
}

export function createPromiseRecursiveFn<R>(callbackFns: CallbackFns) {
  const fns = clonedeep(callbackFns);
  const fnsLength = size(fns);

  return function recursive(
    promise: Promise<unknown>,
    currentIndex = 0
  ): Promise<R> {
    if (isEqual(currentIndex, fnsLength)) {
      return promise as Promise<R>;
    }

    return recursive(
      nextPromise(promise, fns[currentIndex]),
      nextIndex(currentIndex)
    );
  };
}
