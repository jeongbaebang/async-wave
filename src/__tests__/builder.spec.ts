import { asyncWave, AsyncWaveBuilder } from '../index';
import { PromiseCircularityError } from '../utils';

describe('AsyncWaveBuilder', () => {
  describe('Basic chaining', () => {
    it('should chain multiple then() calls', async () => {
      const result = await asyncWave
        .from(10)
        .then((x) => x + 5)
        .then((x) => x * 2)
        .execute();

      expect(result).toBe(30);
    });

    it('should work with async functions', async () => {
      const asyncAdd = async (x: number) => x + 10;
      const asyncMultiply = async (x: number) => x * 3;

      const result = await asyncWave
        .from(5)
        .then(asyncAdd)
        .then(asyncMultiply)
        .execute();

      expect(result).toBe(45);
    });

    it('should work with pipe() for multiple functions', async () => {
      const add5 = (x: number) => x + 5;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;

      const result = await asyncWave
        .from(10)
        .pipe(add5, multiply2, subtract3)
        .execute();

      expect(result).toBe(27); // (10 + 5) * 2 - 3 = 27
    });
  });

  describe('Lifecycle hooks', () => {
    it('should call onSuccess hook', async () => {
      const successMock = jest.fn();

      await asyncWave
        .from(10)
        .then((x) => x * 2)
        .onSuccess(successMock)
        .execute();

      expect(successMock).toHaveBeenCalledWith(20);
    });

    it('should call onError hook on error', async () => {
      const errorMock = jest.fn();
      const errorFn = () => {
        throw new Error('Test error');
      };

      await asyncWave.from(10).then(errorFn).onError(errorMock).execute();

      expect(errorMock).toHaveBeenCalled();
      expect(errorMock.mock.calls[0][0]).toBeInstanceOf(
        PromiseCircularityError,
      );
    });

    it('should call onSettled hook always', async () => {
      const settledMock = jest.fn();

      await asyncWave
        .from(10)
        .then((x) => x * 2)
        .onSettled(settledMock)
        .execute();

      expect(settledMock).toHaveBeenCalled();
    });

    it('should call onSettled even on error', async () => {
      const settledMock = jest.fn();
      const errorFn = () => {
        throw new Error('Test error');
      };

      await asyncWave
        .from(10)
        .then(errorFn)
        .onError(() => {})
        .onSettled(settledMock)
        .execute();

      expect(settledMock).toHaveBeenCalled();
    });

    it('should call before hook before execution', async () => {
      const beforeMock = jest.fn(async () => {});
      const thenMock = jest.fn((x: number) => x * 2);

      await asyncWave.from(10).before(beforeMock).then(thenMock).execute();

      expect(beforeMock).toHaveBeenCalled();
      expect(thenMock).toHaveBeenCalled();
    });
  });

  describe('Promise-like API', () => {
    it('should support catch() as alias for onError()', async () => {
      const errorMock = jest.fn();
      const errorFn = () => {
        throw new Error('Test error');
      };

      await asyncWave.from(10).then(errorFn).catch(errorMock).execute();

      expect(errorMock).toHaveBeenCalled();
    });

    it('should support finally() as alias for onSettled()', async () => {
      const finallyMock = jest.fn();

      await asyncWave
        .from(10)
        .then((x) => x * 2)
        .finally(finallyMock)
        .execute();

      expect(finallyMock).toHaveBeenCalled();
    });
  });

  describe('Static methods', () => {
    it('should support asyncWave.from()', async () => {
      const result = await asyncWave
        .from(5)
        .then((x) => x * 2)
        .execute();

      expect(result).toBe(10);
    });

    it('should support asyncWave.of()', async () => {
      const result = await asyncWave
        .of(5)
        .then((x) => x * 2)
        .execute();

      expect(result).toBe(10);
    });
  });

  describe('run() alias', () => {
    it('should support run() as alias for execute()', async () => {
      const result = await asyncWave
        .from(10)
        .then((x) => x + 5)
        .run();

      expect(result).toBe(15);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complex async chain with all hooks', async () => {
      const beforeMock = jest.fn(async () => {});
      const successMock = jest.fn();
      const settledMock = jest.fn();

      const result = await asyncWave
        .from(1)
        .before(beforeMock)
        .then(async (x) => x + 1)
        .then((x) => x * 2)
        .then(async (x) => x + 3)
        .onSuccess(successMock)
        .onSettled(settledMock)
        .execute();

      expect(result).toBe(7); // ((1 + 1) * 2) + 3 = 7
      expect(beforeMock).toHaveBeenCalled();
      expect(successMock).toHaveBeenCalledWith(7);
      expect(settledMock).toHaveBeenCalled();
    });

    it('should work with promises as initial value', async () => {
      const promiseValue = Promise.resolve(10);

      const result = await asyncWave
        .from<number>(promiseValue)
        .then((x: number) => x * 2)
        .execute();

      expect(result).toBe(20);
    });

    it('should work with functions as initial value', async () => {
      const getValue = () => 15;

      const result = await asyncWave
        .from<number>(getValue)
        .then((x: number) => x * 2)
        .execute();

      expect(result).toBe(30);
    });
  });

  describe('Error handling', () => {
    it('should catch errors in before hook', async () => {
      const errorMock = jest.fn();
      const beforeError = async () => {
        throw new Error('Before error');
      };

      await asyncWave
        .from(10)
        .before(beforeError)
        .then((x) => x * 2)
        .onError(errorMock)
        .execute();

      expect(errorMock).toHaveBeenCalled();
    });

    it('should catch errors in then chain', async () => {
      const errorMock = jest.fn();

      await asyncWave
        .from(10)
        .then((x) => x * 2)
        .then(() => {
          throw new Error('Chain error');
        })
        .then((x) => x + 1) // This should not execute
        .onError(errorMock)
        .execute();

      expect(errorMock).toHaveBeenCalled();
    });
  });
});
