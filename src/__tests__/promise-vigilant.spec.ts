import isPromise from 'is-promise';
import { describe, expect, test } from '@jest/globals';
import {
  createOn,
  createPromiseRecursiveFn,
  nextPromise,
  promisify,
} from '../utils/fn';
import { vigilAsync } from '../index';

describe('promisify()', () => {
  test('원시값을 전달하면 함수를 반환한다.', () => {
    expect(typeof promisify(10) === 'function').toBeTruthy();
  });

  test('항상 반환값은 프로미스이다.', () => {
    expect(isPromise(promisify(10)())).toBeTruthy();
    expect(isPromise(promisify(() => 10, true)())).toBeTruthy();
    expect(isPromise(promisify(async () => 10)())).toBeTruthy();
  });

  test('두번째 인수로 true를 전달하면 일반 함수도 프로미스를 반환한다.', () => {
    const fn = promisify(() => 10, true);

    expect(isPromise(fn())).toBeTruthy();
  });

  test('두번째 인수를 전달하지 않고 일반 함수를 전달한다면 프로미스가 아닌 일반 함수를 반환한다.', () => {
    expect(isPromise(promisify(() => 10, false)())).toBeFalsy();

    expect(isPromise(promisify(() => 10)())).toBeFalsy();

    expect(typeof promisify(() => 10, false)).toBe('function');

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

  describe('settled', () => {
    test('함수를 반환한다.', () => {
      const fn = jest.fn();

      expect(typeof createOn.settled(fn) === 'function').toBeTruthy();
    });

    test('항상 undefined를 반환한다.', () => {
      const fn = jest.fn();

      expect(typeof createOn.settled(fn)()).toBe('undefined');
      expect(typeof createOn.settled()()).toBe('undefined');
    });

    test('콜백을 전달하면 콜백을 호출한다.', () => {
      const fn = jest.fn();

      createOn.settled(fn)();

      expect(fn).toHaveBeenCalled();
    });
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
  const fn1 = (arg0: number) => arg0 + 10;
  const fn2 = (arg0: number) => arg0 + 20;

  test('항상 프로미스를 반환해야 한다.', () => {
    expect(isPromise(vigilAsync(10, [fn1, fn2]))).toBeTruthy();
    expect(isPromise(vigilAsync(() => 10, [fn1, fn2]))).toBeTruthy();
    expect(isPromise(vigilAsync(async () => 10, [fn1, fn2]))).toBeTruthy();
  });

  test('두번째 인자로 배열에 전달한 함수가 차례대로 실행된다.', () => {
    vigilAsync(10, [fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });

    vigilAsync(async () => 10, [fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });

    vigilAsync(() => 10, [fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });
  });

  describe('vigilAsync Options Test', () => {
    describe('onSuccess', () => {
      test('콜백 함수의 반환값이 매개변수로 전달된다.', () => {
        vigilAsync(10, [fn1, fn2], {
          onSuccess: (received) => {
            expect(received).toBe(40);
          },
        });
      });
    });

    describe('onError', () => {
      test('에러콜백의 반환값이 전달된다', () => {
        expect(() => {
          vigilAsync(10, [fn1, fn2], {
            onError: () => {
              return 'error';
            },
          }).then((msg) => expect(msg).toBe('error'));
        });
      });
    });

    describe('onSettled', () => {
      const throwError = () => {
        throw new Error();
      };

      test('fulfilled, rejected 어떤 상태가 되어도 항상 콜백을 실행한다.', async () => {
        const fn = jest.fn();

        await vigilAsync(10, [fn1, fn2], {
          onSettled: fn,
        });

        await vigilAsync(10, [throwError], {
          onError: fn,
          onSettled: fn,
        });

        expect(fn).toHaveBeenCalledTimes(3);
      });
    });
  });
});
