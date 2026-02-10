import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MainThread } from '../../src/main/threads/MainThread';
import { MockWriterThread } from '../mocks/MockWriterThread';

describe('Thread Communication Scenarios', () => {
  let mainThread: MainThread;

  beforeEach(async () => {
    mainThread = new MainThread();
    await mainThread.initialize();
  });

  afterEach(async () => {
    await mainThread.terminate();
  });

  describe('Scenario 5.1: Message Passing Reliability', () => {
    it('should deliver 1000 messages without loss', async () => {
      const messageCount = 1000;
      const received: number[] = [];

      mainThread.on('message', (msg) => {
        if (msg.type === 'ECHO') {
          received.push(msg.id);
        }
      });

      for (let i = 0; i < messageCount; i++) {
        await mainThread.sendToWriter({ type: 'PING', id: i });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(received.length).toBe(messageCount);
      expect(new Set(received).size).toBe(messageCount);
    });

    it('should preserve message order per thread', async () => {
      const messages: number[] = [];

      mainThread.on('message', (msg) => {
        messages.push(msg.sequence);
      });

      for (let i = 0; i < 100; i++) {
        await mainThread.sendToWriter({ type: 'TEST', sequence: i });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      for (let i = 1; i < messages.length; i++) {
        expect(messages[i]).toBeGreaterThan(messages[i - 1]);
      }
    });
  });

  describe('Scenario 5.2: Shared State Synchronization', () => {
    it('should handle concurrent counter updates atomically', async () => {
      const sharedBuffer = new SharedArrayBuffer(4);
      const counter = new Int32Array(sharedBuffer);

      const incrementPromises = Array(1000).fill(null).map(() =>
        mainThread.incrementSharedCounter(sharedBuffer, 0)
      );

      await Promise.all(incrementPromises);

      expect(counter[0]).toBe(1000);
    });
  });

  describe('Scenario 5.3: Thread Communication Timeout', () => {
    it('should timeout after 30 seconds of no response', async () => {
      const start = Date.now();

      await expect(
        mainThread.sendToWriter({ type: 'HANG' }, 30000)
      ).rejects.toThrow('Timeout');

      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(30000);
      expect(duration).toBeLessThan(31000);
    });
  });
});
