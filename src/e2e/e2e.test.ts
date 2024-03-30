import axios from 'axios';
import { describe, expect, test } from '@jest/globals';

import { asyncWave } from '../index';
import { Response } from '../mocks/type';

async function getUser() {
  const { data } = await axios.get<Response>('/api/v1/users');

  return data;
}

describe('e2e Test', () => {
  test('특정 함수가 실행되고 난뒤 실행되어야 한다.', () => {
    const delay = 300;
    const mockLoadingIndicator = jest.fn();

    asyncWave<Response>([getUser], {
      onBefore: () => {
        mockLoadingIndicator(delay);
      },
      onSuccess: (data) => {
        expect(data.total).toBe(10);
        expect(data.payload).toHaveLength(10);
      },
    });

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
