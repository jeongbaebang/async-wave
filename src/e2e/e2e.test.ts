import axios from 'axios';
import { describe, expect, test } from '@jest/globals';

import { asyncWave } from '../core';
import { Response } from '../mocks/type';

async function getUser(isError?: boolean) {
  const { data } = await axios.get<Response>('/api/v1/users', {
    params: {
      isError: isError,
    },
  });

  return data;
}

describe('e2e Test', () => {
  test('특정 함수가 실행되고 난뒤 실행되어야 한다.', async () => {
    const delay = 300;
    const mockLoadingIndicator = jest.fn();
    const onSuccessMockFn = jest.fn();

    await asyncWave<Response>([getUser], {
      onBefore: async () => {
        mockLoadingIndicator(delay);
        expect(onSuccessMockFn).not.toBeCalledWith();
      },
      onSuccess: (data) => {
        onSuccessMockFn();
        expect(mockLoadingIndicator).toBeCalledWith(delay);
        expect(data.total).toBe(10);
        expect(data.payload).toHaveLength(10);
      },
    });

    expect(onSuccessMockFn).toBeCalledWith();
    expect(mockLoadingIndicator).toBeCalledWith(delay);
  });

  test('서버로 요청된 값이 올바르게 반환되어야 한다.', () => {
    asyncWave<Response>([getUser], {
      onSuccess: (data) => {
        expect(data.total).toBe(10);
        expect(data.payload).toHaveLength(10);
      },
    });
  });

  test('올바르게 값을 변형해야 한다.', () => {
    const findUser = (targetId: number) => {
      return ({ payload }: Response) => {
        return {
          payload: payload.filter(({ id }) => id === targetId),
        };
      };
    };

    asyncWave<Response>([getUser, findUser(4)], {
      onSuccess: ({ payload }) => {
        expect(payload).toHaveLength(1);
      },
    });

    asyncWave<Response>([getUser, findUser(4)], {
      onSuccess: ({ payload }) => {
        expect(payload).toHaveLength(1);
      },
    });
  });

  describe('예외 테스트', () => {
    const errorMessage = `Request failed with status code 403`;
    const getWrongUser = async () => {
      await getUser(true);
    };

    test('에러를 올바르게 캐치해야 한다.', () => {
      const fn1 = (arg0: number) => arg0 + 10;

      asyncWave([getWrongUser, 10, fn1], {
        onError: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain(errorMessage);
        },
      });

      asyncWave([10, getWrongUser, fn1], {
        onError: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain(errorMessage);
        },
      });

      asyncWave([10, fn1, getWrongUser], {
        onError: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain(errorMessage);
        },
      });

      asyncWave([10, () => {}], {
        onBefore: async () => {
          await getUser(true);
        },
      }).catch((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(errorMessage);
      });
    });

    test('onBefore 핸들러에서 발생하는 에러도 캐치해야 한다.', async () => {
      const onErrorMockFn = jest.fn();

      await asyncWave<Response>([getUser], {
        onBefore: async () => {
          await getWrongUser();
        },
        onError: () => onErrorMockFn(),
      });

      expect(onErrorMockFn).toHaveBeenCalled();
    });
  });
});
