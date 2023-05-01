import isPromise from 'is-promise';
import { describe, expect, test } from '@jest/globals';
import {
  createOn,
  createPromiseRecursiveFn,
  nextPromise,
  promisify,
} from '../utils/fn';
import vigilAsync from '../index';

describe('promisify()', () => {
  test('원시값을 전달하면 함수를 반환한다.', () => {
    expect(typeof promisify(10) === 'function').toBeTruthy();
  });

  test('항상 반환값은 프로미스이다.', () => {
    expect(isPromise(promisify(10)())).toBeTruthy();

    expect(isPromise(promisify(async () => 10)())).toBeTruthy();
  });

  test('두번째 인수로 true를 전달하면 일반 함수도 프로미스를 반환한다.', () => {
    expect(isPromise(promisify(() => 10, true)())).toBeTruthy();
  });

  test('두번째 인수를 전달하지 않고 일반 함수를 전달한다면 프로미스가 아닌 일반 함수를 반환한다.', () => {
    expect(isPromise(promisify(() => 10, false)())).toBeFalsy();

    expect(isPromise(promisify(() => 10)())).toBeFalsy();

    expect(typeof promisify(() => 10, false) === 'function').toBeTruthy();

    expect(promisify(() => 10)()).toBe(10);
  });
});

describe('createOn()', () => {
  test('error 메소드는 함수를 반환한다.', () => {
    expect(typeof createOn.error(undefined) === 'function').toBeTruthy();
  });

  test('인수를 전달하지 않은 error 메소드는 에러를 방출시킨다.', () => {
    const fn = createOn.error(undefined);

    expect(() => {
      fn(new Error());
    }).toThrow();
  });

  test('인수를 전달한 error 메소드는 에러를 방출시키지 않는다.', () => {
    const fn = createOn.error(() => 'catch');

    expect(() => {
      fn(new Error());
    }).not.toThrow();
  });

  test('sucess 메소드는 함수를 반환한다.', () => {
    expect(typeof createOn.sucess(undefined) === 'function').toBeTruthy();
  });

  test('인수를 전달한 sucess 메소드는 40을 반환한다. (값의 부수효과가 없다)', () => {
    const fn = createOn.sucess((arg0: number) => arg0 + 150);

    expect(fn(40)).toBe(40);
  });

  test('인수를 전달하지 않은 sucess 메소드는 50을 반환한다.', () => {
    const fn = createOn.sucess(undefined);

    expect(fn(50)).toBe(50);
  });
});

describe('nextPromise()', () => {
  const promiseFn = async () => 10;

  test('함수를 호출하면 프로미스 객체를 반환한다.', () => {
    const fn = nextPromise(promiseFn(), (arg) => arg);

    expect(isPromise(fn) && typeof fn === 'object').toBeTruthy();
  });
});

describe('createPromiseRecursiveFn()', () => {
  test('함수를 호출하면 함수를 반환한다.', () => {
    expect(
      typeof createPromiseRecursiveFn([() => '']) === 'function'
    ).toBeTruthy();
  });

  test('반환된 함수를 실행하면 기대값 10을 반환한다.', async () => {
    const promiseFn = async () => 1;
    const fn = createPromiseRecursiveFn([(a) => a + 3, (b) => b + 6]);
    const result = await fn(promiseFn());

    expect(result).toBe(10);
  });
});

describe('vigilAsync()', () => {
  test('10을 전달하면 40을 반환한다.', async () => {
    const fn1 = (arg0: number) => arg0 + 10;
    const fn2 = (arg0: number) => arg0 + 20;

    expect(await vigilAsync(10, [fn1, fn2])).toBe(40);
    expect(await vigilAsync(async () => 10, [fn1, fn2])).toBe(40);
  });
});
