import isPromise from 'is-promise';
import { describe, expect, test } from '@jest/globals';
import {
  createOn,
  createPromiseRecursiveFn,
  nextPromise,
  promisify,
} from '../utils/fn';
import { asyncWave } from '../index';

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
    expect(typeof createOn.success(undefined) === 'function').toBeTruthy();
  });

  test('인수를 전달한 sucess 메소드는 결과값을 반환한다.', () => {
    const fn = createOn.success((arg0: number) => arg0 + 150);

    expect(fn(40)).toBe(190);
  });

  test('인수를 전달하지 않은 sucess 메소드는 50을 반환한다.', () => {
    const fn = createOn.success(undefined);

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
      typeof createPromiseRecursiveFn([() => '']) === 'function',
    ).toBeTruthy();
  });

  test('반환된 함수를 실행하면 기대값 10을 반환한다.', async () => {
    const promiseFn = async () => 1;
    const fn = createPromiseRecursiveFn([
      (a: number) => a + 3,
      (b: number) => b + 6,
    ]);
    const result = await fn(promiseFn());

    expect(result).toBe(10);
  });
});

describe('asyncWave()', () => {
  const fn1 = (arg0: number) => arg0 + 10;
  const fn2 = (arg0: number) => arg0 + 20;
  const throwError = () => {
    throw new Error('new Error');
  };

  test('항상 프로미스를 반환해야 한다.', () => {
    expect(isPromise(asyncWave(10, [fn1, fn2]))).toBeTruthy();
    expect(isPromise(asyncWave(() => 10, [fn1, fn2]))).toBeTruthy();
    expect(isPromise(asyncWave(async () => 10, [fn1, fn2]))).toBeTruthy();
  });

  test('두번째 인자로 배열에 전달한 함수가 차례대로 실행된다.', () => {
    asyncWave<number, number>(10, [fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });

    asyncWave<Promise<number>, number>(async () => 10, [fn1, fn2]).then(
      (value) => {
        expect(value).toBe(40);
      },
    );

    asyncWave<number, number>(() => 10, [fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });
  });

  test('첫번째 인수가 배열이라면 배열의 첫번째 요소를 첫 인자로 받아야 한다.', () => {
    asyncWave<number>([10, fn1, fn2]).then((value) => {
      expect(value).toBe(40);
    });
  });

  describe('asyncWave Options Test', () => {
    describe('beforeStart', () => {
      const mockBeforeStart = jest.fn();

      test('메서드 체이닝이 실행되기 전에 가장 먼저 실행되어야 한다.', () => {
        asyncWave<number, number>(10, [fn1, fn2], {
          onBefore: () => {
            mockBeforeStart();
          },
          onSuccess: (received) => {
            expect(received).toBe(40);
          },
        });

        expect(mockBeforeStart).toBeCalled();
      });

      test('에러가 발생하면 외부로 방출해야 한다.', () => {
        expect(
          asyncWave<number, number>(10, [fn1], {
            onBefore: () => throwError(),
          }),
        ).rejects.toThrowError('new Error');
      });

      test('에러 핸들러를 전달하면 외부로 방출되지 않고 캐치되어야 한다.', () => {
        const onErrorMockFn = jest.fn();

        asyncWave<number, number>(10, [fn1], {
          onBefore: () => throwError(),
          onError: () => onErrorMockFn(),
        });

        expect(onErrorMockFn).toHaveBeenCalled();
      });
    });

    describe('onSuccess', () => {
      test('콜백 함수의 반환값이 매개변수로 전달된다.', async () => {
        asyncWave<number, number>(10, [fn1, fn2], {
          onSuccess: (received) => {
            expect(received).toBe(40);
          },
        });
      });

      test('프로미스값을 반환해야 한다.', async () => {
        asyncWave<number, number>(10, [fn1, fn2], {
          onSuccess: (received) => {
            return received + 10;
          },
        }).then((value) => {
          expect(value).toBe(50);
        });

        asyncWave<number, number>(10, [fn1, fn2]).then((value1) => {
          expect(value1).toBe(40);
        });

        const value2 = await asyncWave<number, number>(10, [fn1, fn2], {
          onSuccess: (received) => {
            return received;
          },
        });

        expect(value2).toBe(40);

        const value3 = await asyncWave<number, number>(10, [fn1, fn2]);

        expect(value3).toBe(40);
      });
    });

    describe('onError', () => {
      test('에러 핸들러를 전달하면 캐치되어야 한다.', () => {
        const mockOnSuccessFn = jest.fn();

        asyncWave<number, number>(10, [throwError, fn1], {
          onError: (error) => {
            expect(error instanceof Error).toBeTruthy();
          },
          onSuccess: () => {
            mockOnSuccessFn();
          },
        });

        expect(mockOnSuccessFn).not.toBeCalled();
      });

      test('에러 핸들러를 전달하지 않으면 외부로 방출해야 한다.', async () => {
        const mockOnSuccessFn = jest.fn();

        expect.assertions(3);

        try {
          await asyncWave<number, number>(10, [throwError, fn1], {
            onSuccess: () => {
              mockOnSuccessFn();
            },
          });
        } catch (error) {
          expect(error instanceof Error).toBeTruthy();
        }

        expect(
          asyncWave<number, number>(10, [throwError, fn1], {
            onSuccess: () => {
              mockOnSuccessFn();
            },
          }),
        ).rejects.toThrowError('new Error');

        expect(mockOnSuccessFn).not.toBeCalled();
      });

      test('에러가 발생하면 다음 핸들러는 실행되지 않아야 한다.', async () => {
        const mockOnSuccessFn = jest.fn();

        asyncWave<number, number>(10, [throwError, mockOnSuccessFn], {
          onError: () => {},
        });

        expect(mockOnSuccessFn).not.toBeCalled();

        try {
          await asyncWave<number, number>(10, [throwError, mockOnSuccessFn]);
        } catch (error) {
          expect(error instanceof Error).toBeTruthy();
        }

        expect(mockOnSuccessFn).not.toBeCalled();
      });

      test('에러가 성공적으로 처리되면 onSuccess 핸들러를 제외한 가장 가까운 then 핸들러로 제어흐름이 넘어가야 한다.', async () => {
        const mockOnSuccessFn = jest.fn();

        await asyncWave<number, number>(10, [throwError, fn1], {
          onError: (error) => {
            expect(error instanceof Error).toBeTruthy();
          },
          onSuccess: () => {
            mockOnSuccessFn(); // 실행되지 않는다.
          },
        }).then(mockOnSuccessFn);

        expect(mockOnSuccessFn).toBeCalledTimes(1);
      });
    });

    describe('onSettled', () => {
      const throwError = () => {
        throw new Error();
      };

      test('fulfilled, rejected 어떤 상태가 되어도 항상 콜백을 실행한다.', async () => {
        const fn = jest.fn();

        await asyncWave<number, number>(10, [fn1, fn2], {
          onSettled: fn,
        });

        await asyncWave<number, number>(10, [throwError], {
          onError: fn,
          onSettled: fn,
        });

        expect(fn).toHaveBeenCalledTimes(3);
      });
    });
  });
});
