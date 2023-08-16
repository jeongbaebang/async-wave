import { describe, expect, test } from '@jest/globals';

import { asyncWave } from '../index';
import { getUser } from './example/getUsers';
import { Response } from '../mocks/type';

describe('e2e Test', () => {
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

    asyncWave<Promise<Response>, Response>(getUser, [findUser(4)], {
      onSuccess: ({ payload }) => {
        expect(payload).toHaveLength(1);
      },
    });
  });

  test('에러를 올바르게 캐치해야 한다.', () => {
    const throwError = () => {
      throw new Error('Network Error');
    };

    asyncWave<Response>([getUser, throwError], {
      onError: (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Network Error');
      },
    });
  });
});
