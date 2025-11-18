import { asyncWave, TimeoutError, AbortError, AsyncWaveBuilder } from '../index';

describe('Advanced Features', () => {
  beforeEach(() => {
    // Clear cache before each test
    AsyncWaveBuilder.clearCache();
  });

  describe('retry()', () => {
    it('should retry on failure with linear strategy', async () => {
      let attempts = 0;
      const flaky = () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      };

      const result = await asyncWave
        .from(0)
        .then(flaky)
        .retry(3, { delay: 10 })
        .execute();

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should retry with exponential backoff', async () => {
      let attempts = 0;
      const delays: number[] = [];
      let lastTime = Date.now();

      const flaky = () => {
        attempts++;
        const now = Date.now();
        if (attempts > 1) {
          delays.push(now - lastTime);
        }
        lastTime = now;

        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      };

      const result = await asyncWave
        .from(0)
        .then(flaky)
        .retry(3, { strategy: 'exponential', delay: 50, maxDelay: 200 })
        .execute();

      expect(result).toBe('success');
      expect(attempts).toBe(3);
      // Exponential delays: ~50ms, ~100ms
      expect(delays[0]).toBeGreaterThanOrEqual(45);
      expect(delays[1]).toBeGreaterThanOrEqual(95);
    });

    it('should respect maxDelay in exponential backoff', async () => {
      let attempts = 0;
      const delays: number[] = [];
      let lastTime = Date.now();

      const flaky = () => {
        attempts++;
        const now = Date.now();
        if (attempts > 1) {
          delays.push(now - lastTime);
        }
        lastTime = now;

        if (attempts < 4) {
          throw new Error('Failed');
        }
        return 'success';
      };

      await asyncWave
        .from(0)
        .then(flaky)
        .retry(4, { strategy: 'exponential', delay: 100, maxDelay: 150 })
        .execute();

      // With maxDelay 150ms, third delay should not exceed it
      expect(delays[2]).toBeLessThan(170); // Some tolerance
    });

    it('should support custom shouldRetry condition', async () => {
      let attempts = 0;
      const flaky = () => {
        attempts++;
        const error: any = new Error('Network error');
        error.code = attempts === 1 ? 'TIMEOUT' : 'AUTH_FAILED';
        throw error;
      };

      try {
        await asyncWave
          .from(0)
          .then(flaky)
          .retry(3, {
            shouldRetry: (error) => error.code === 'TIMEOUT',
          })
          .execute();
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe('AUTH_FAILED');
        expect(attempts).toBe(2); // First attempt + 1 retry (then stops)
      }
    });

    it('should throw after all retries exhausted', async () => {
      let attempts = 0;
      const alwaysFails = () => {
        attempts++;
        throw new Error('Always fails');
      };

      await expect(
        asyncWave.from(0).then(alwaysFails).retry(2).execute(),
      ).rejects.toThrow('Always fails');

      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should not retry on success', async () => {
      let attempts = 0;
      const succeeds = () => {
        attempts++;
        return 'success';
      };

      const result = await asyncWave
        .from(0)
        .then(succeeds)
        .retry(3)
        .execute();

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });
  });

  describe('timeout()', () => {
    it('should timeout if operation takes too long', async () => {
      const slow = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'completed';
      };

      await expect(
        asyncWave.from(0).then(slow).timeout(50).execute(),
      ).rejects.toThrow(TimeoutError);
    });

    it('should include timeout duration in error', async () => {
      const slow = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'completed';
      };

      try {
        await asyncWave.from(0).then(slow).timeout(50).execute();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).timeoutMs).toBe(50);
      }
    });

    it('should not timeout if operation completes in time', async () => {
      const fast = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'completed';
      };

      const result = await asyncWave
        .from(0)
        .then(fast)
        .timeout(100)
        .execute();

      expect(result).toBe('completed');
    });

    it('should work with retry', async () => {
      let attempts = 0;
      const slow = async () => {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'completed';
      };

      await expect(
        asyncWave.from(0).then(slow).retry(2).timeout(50).execute(),
      ).rejects.toThrow(TimeoutError);

      // Should timeout on first attempt, not retry
      expect(attempts).toBe(1);
    });
  });

  describe('tap() and debug()', () => {
    it('should execute tap without modifying value', async () => {
      const sideEffects: number[] = [];

      const result = await asyncWave
        .from(10)
        .tap((x) => sideEffects.push(x))
        .then((x) => x * 2)
        .tap((x) => sideEffects.push(x))
        .execute();

      expect(result).toBe(20);
      expect(sideEffects).toEqual([10, 20]);
    });

    it('should support async tap functions', async () => {
      const sideEffects: number[] = [];

      const result = await asyncWave
        .from(5)
        .tap(async (x) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          sideEffects.push(x);
        })
        .then((x) => x + 5)
        .execute();

      expect(result).toBe(10);
      expect(sideEffects).toEqual([5]);
    });

    it('should log debug messages with label', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await asyncWave
        .from(10)
        .debug('Initial value')
        .then((x) => x * 2)
        .debug('After multiply')
        .execute();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AsyncWave Debug] Initial value:',
        10,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AsyncWave Debug] After multiply:',
        20,
      );

      consoleSpy.mockRestore();
    });

    it('should log debug messages without label', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await asyncWave.from(42).debug().execute();

      expect(consoleSpy).toHaveBeenCalledWith('[AsyncWave Debug]', 42);

      consoleSpy.mockRestore();
    });
  });

  describe('delay()', () => {
    it('should delay execution', async () => {
      const start = Date.now();

      await asyncWave
        .from('value')
        .delay(100)
        .then((x) => x)
        .execute();

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });

    it('should delay before chain execution', async () => {
      const events: string[] = [];

      await asyncWave
        .from('start')
        .delay(50)
        .tap(() => events.push('after delay'))
        .execute();

      expect(events).toEqual(['after delay']);
    });

    it('should work with other features', async () => {
      const start = Date.now();

      const result = await asyncWave
        .from(10)
        .delay(50)
        .then((x) => x * 2)
        .execute();

      const elapsed = Date.now() - start;
      expect(result).toBe(20);
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('when() and unless()', () => {
    it('should execute function when condition is true', async () => {
      const result = await asyncWave
        .from(10)
        .when(
          (x) => x > 5,
          (x) => x * 2,
        )
        .execute();

      expect(result).toBe(20);
    });

    it('should not execute function when condition is false', async () => {
      const result = await asyncWave
        .from(3)
        .when(
          (x) => x > 5,
          (x) => x * 2,
        )
        .execute();

      expect(result).toBe(3);
    });

    it('should support async conditions', async () => {
      const asyncCondition = async (x: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return x > 5;
      };

      const result = await asyncWave
        .from(10)
        .when(asyncCondition, (x) => x * 2)
        .execute();

      expect(result).toBe(20);
    });

    it('should support boolean conditions', async () => {
      const result1 = await asyncWave
        .from(10)
        .when(true, (x) => x * 2)
        .execute();

      const result2 = await asyncWave
        .from(10)
        .when(false, (x) => x * 2)
        .execute();

      expect(result1).toBe(20);
      expect(result2).toBe(10);
    });

    it('should execute unless when condition is false', async () => {
      const result = await asyncWave
        .from(3)
        .unless(
          (x) => x > 5,
          (x) => x * 10,
        )
        .execute();

      expect(result).toBe(30);
    });

    it('should not execute unless when condition is true', async () => {
      const result = await asyncWave
        .from(10)
        .unless(
          (x) => x > 5,
          (x) => x * 10,
        )
        .execute();

      expect(result).toBe(10);
    });
  });

  describe('fallback()', () => {
    it('should return fallback value on error', async () => {
      const failingFn = () => {
        throw new Error('Failed');
      };

      const result = await asyncWave
        .from(0)
        .then(failingFn)
        .fallback(42)
        .execute();

      expect(result).toBe(42);
    });

    it('should not use fallback on success', async () => {
      const result = await asyncWave
        .from(10)
        .then((x) => x * 2)
        .fallback(0)
        .execute();

      expect(result).toBe(20);
    });

    it('should work with retry', async () => {
      let attempts = 0;
      const alwaysFails = () => {
        attempts++;
        throw new Error('Failed');
      };

      const result = await asyncWave
        .from(0)
        .then(alwaysFails)
        .retry(2)
        .fallback(999)
        .execute();

      expect(result).toBe(999);
      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should work with complex objects', async () => {
      const failingFn = () => {
        throw new Error('Failed');
      };

      const defaultUser = { id: 0, name: 'Guest' };

      const result = await asyncWave
        .from(123)
        .then(failingFn)
        .fallback(defaultUser)
        .execute();

      expect(result).toEqual(defaultUser);
    });
  });

  describe('parallel()', () => {
    it('should execute multiple promises in parallel', async () => {
      const promise1 = Promise.resolve(1);
      const promise2 = Promise.resolve(2);
      const promise3 = Promise.resolve(3);

      const results = await asyncWave.parallel([promise1, promise2, promise3]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should work with async functions', async () => {
      const fetchUser = async () => ({ id: 1, name: 'Alice' });
      const fetchPosts = async () => ['post1', 'post2'];
      const fetchComments = async () => ['comment1'];

      const [user, posts, comments] = await asyncWave.parallel([
        fetchUser(),
        fetchPosts(),
        fetchComments(),
      ]);

      expect(user).toEqual({ id: 1, name: 'Alice' });
      expect(posts).toEqual(['post1', 'post2']);
      expect(comments).toEqual(['comment1']);
    });

    it('should be faster than sequential execution', async () => {
      const delay = (ms: number, value: any) =>
        new Promise((resolve) => setTimeout(() => resolve(value), ms));

      const start1 = Date.now();
      const [r1, r2, r3] = await asyncWave.parallel([
        delay(50, 1),
        delay(50, 2),
        delay(50, 3),
      ]);
      const parallelTime = Date.now() - start1;

      // Parallel should take ~50ms (all run at once)
      expect(parallelTime).toBeLessThan(100);
      expect([r1, r2, r3]).toEqual([1, 2, 3]);
    });

    it('should fail if any promise fails', async () => {
      const promise1 = Promise.resolve(1);
      const promise2 = Promise.reject(new Error('Failed'));
      const promise3 = Promise.resolve(3);

      await expect(
        asyncWave.parallel([promise1, promise2, promise3]),
      ).rejects.toThrow('Failed');
    });

    it('should work with mixed sync and async values', async () => {
      const results = await asyncWave.parallel([
        42,
        Promise.resolve('hello'),
        (async () => true)(),
      ]);

      expect(results).toEqual([42, 'hello', true]);
    });
  });

  describe('abort()', () => {
    it('should abort execution before it starts', async () => {
      const builder = asyncWave.from(0).then(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'completed';
      });

      // Abort before execution
      builder.abort();

      await expect(builder.execute()).rejects.toThrow(AbortError);
    });

    it('should detect abort after delay', async () => {
      let executed = false;

      const builder = asyncWave
        .from(0)
        .delay(50)
        .then(() => {
          executed = true;
          return 'completed';
        });

      // Abort before execution
      builder.abort();

      await expect(builder.execute()).rejects.toThrow(AbortError);
      expect(executed).toBe(false);
    });
  });

  describe('cache()', () => {
    it('should cache results', async () => {
      let calls = 0;
      const expensive = () => {
        calls++;
        return 'result';
      };

      const result1 = await asyncWave
        .from(1)
        .then(expensive)
        .cache(1000)
        .execute();

      const result2 = await asyncWave
        .from(1)
        .then(expensive)
        .cache(1000)
        .execute();

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(calls).toBe(1); // Only called once
    });

    it('should expire cache after TTL', async () => {
      let calls = 0;
      const expensive = () => {
        calls++;
        return `result-${calls}`;
      };

      const result1 = await asyncWave
        .from(1)
        .then(expensive)
        .cache(50)
        .execute();

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      const result2 = await asyncWave
        .from(1)
        .then(expensive)
        .cache(50)
        .execute();

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-2');
      expect(calls).toBe(2);
    });

    it('should use different cache for different inputs', async () => {
      let calls = 0;
      const expensive = (x: number) => {
        calls++;
        return x * 2;
      };

      const result1 = await asyncWave
        .from(10)
        .then(expensive)
        .cache(1000)
        .execute();

      const result2 = await asyncWave
        .from(20)
        .then(expensive)
        .cache(1000)
        .execute();

      expect(result1).toBe(20);
      expect(result2).toBe(40);
      expect(calls).toBe(2); // Different inputs = different cache keys
    });

    it('should support custom cache key', async () => {
      let calls = 0;
      const expensive = () => {
        calls++;
        return 'result';
      };

      const result1 = await asyncWave
        .from({ userId: 1, extra: 'data1' })
        .then(expensive)
        .cache(1000, { key: (data) => `user-${data.userId}` })
        .execute();

      const result2 = await asyncWave
        .from({ userId: 1, extra: 'data2' })
        .then(expensive)
        .cache(1000, { key: (data) => `user-${data.userId}` })
        .execute();

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(calls).toBe(1); // Same userId = same cache
    });

    it('should clear cache', async () => {
      let calls = 0;
      const expensive = () => {
        calls++;
        return 'result';
      };

      await asyncWave.from(1).then(expensive).cache(1000).execute();

      AsyncWaveBuilder.clearCache();

      await asyncWave.from(1).then(expensive).cache(1000).execute();

      expect(calls).toBe(2); // Cache was cleared
    });
  });

  describe('Integration scenarios', () => {
    it('should combine retry, timeout, and fallback', async () => {
      let attempts = 0;
      const unreliable = async () => {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('Service unavailable');
      };

      const result = await asyncWave
        .from('api-request')
        .then(unreliable)
        .retry(2, { delay: 10 })
        .timeout(50)
        .fallback('default-value')
        .execute();

      expect(result).toBe('default-value');
      expect(attempts).toBeGreaterThan(0);
    });

    it('should combine all features in real-world scenario', async () => {
      const logs: string[] = [];
      let apiCalls = 0;

      const fetchUserData = async (userId: number) => {
        apiCalls++;
        logs.push(`Fetching user ${userId}`);

        if (apiCalls < 2) {
          throw new Error('Network error');
        }

        await new Promise((resolve) => setTimeout(resolve, 20));
        return { id: userId, name: 'Alice', isPremium: true };
      };

      const sendWelcomeEmail = async (user: any) => {
        logs.push(`Sending email to ${user.name}`);
        return user;
      };

      const result = await asyncWave
        .from(123)
        .before(async () => {
          logs.push('Starting request');
        })
        .delay(10)
        .tap((id) => {
          logs.push(`User ID: ${id}`);
        })
        .then(fetchUserData)
        .retry(3, { delay: 10 })
        .timeout(1000)
        .tap((user) => logs.push(`Before when: ${user.name}`))
        .then((user) => (user.isPremium ? sendWelcomeEmail(user) : user))
        .tap((user) => {
          logs.push(`Final user: ${user.name}`);
        })
        .cache(60000)
        .fallback({ id: 0, name: 'Guest', isPremium: false })
        .onSuccess((user: any) => {
          logs.push(`Success: ${user.name}`);
        })
        .execute();

      expect(result).toEqual({ id: 123, name: 'Alice', isPremium: true });
      expect(logs).toContain('Starting request');
      expect(logs).toContain('User ID: 123');
      expect(logs).toContain('Fetching user 123');
      expect(logs).toContain('Sending email to Alice');
      expect(logs).toContain('Final user: Alice');
      expect(logs).toContain('Success: Alice');
      expect(apiCalls).toBe(2); // Failed once, succeeded on retry
    });

    it('should handle parallel execution with retry and timeout', async () => {
      let userCalls = 0;
      let postCalls = 0;

      const fetchUser = async () => {
        userCalls++;
        if (userCalls < 2) throw new Error('User service down');
        return { id: 1, name: 'Alice' };
      };

      const fetchPosts = async () => {
        postCalls++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return ['post1', 'post2'];
      };

      const userPromise = asyncWave
        .from(1)
        .then(fetchUser)
        .retry(2)
        .execute();

      const postsPromise = asyncWave
        .from(1)
        .then(fetchPosts)
        .timeout(100)
        .execute();

      const [user, posts] = await asyncWave.parallel([
        userPromise,
        postsPromise,
      ]);

      expect(user).toEqual({ id: 1, name: 'Alice' });
      expect(posts).toEqual(['post1', 'post2']);
      expect(userCalls).toBe(2);
      expect(postCalls).toBe(1);
    });
  });
});
