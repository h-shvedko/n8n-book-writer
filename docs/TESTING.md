# Testing Strategy for Multi-threaded n8n Writer

## Test Scenarios

### 1. Thread Lifecycle Management

#### Scenario 1.1: Initial Thread Creation
- **Given**: Application starts
- **When**: Main process initializes
- **Then**: All worker threads (Writer, Scheduler, Storage) are created successfully
- **Then**: Each thread reports ready status within 5 seconds

#### Scenario 1.2: Thread Termination
- **Given**: Application is running with active threads
- **When**: User closes the application
- **Then**: All worker threads terminate gracefully within 10 seconds
- **Then**: No orphaned processes remain

#### Scenario 1.3: Thread Crash Recovery
- **Given**: A worker thread crashes unexpectedly
- **When**: Main thread detects the crash
- **Then**: The crashed thread is restarted automatically
- **Then**: Pending tasks are reassigned to the new thread instance

### 2. Content Generation (Writer Thread)

#### Scenario 2.1: Single Article Generation
- **Given**: Writer thread is idle
- **When**: Main thread requests article generation with valid parameters
- **Then**: Writer thread generates content using Claude API
- **Then**: Generated content is returned to main thread within 30 seconds
- **Then**: Content meets quality criteria (min 500 words, proper structure)

#### Scenario 2.2: Concurrent Content Generation
- **Given**: Multiple content requests queued
- **When**: 5 article generation requests sent simultaneously
- **Then**: Writer thread processes them sequentially
- **Then**: Each article completes successfully
- **Then**: UI remains responsive during generation

#### Scenario 2.3: API Error Handling
- **Given**: Writer thread receives generation request
- **When**: Claude API returns error (rate limit, timeout)
- **Then**: Writer thread retries with exponential backoff
- **Then**: After 3 failed attempts, error is reported to main thread
- **Then**: Thread remains operational for subsequent requests

### 3. Task Scheduling (Scheduler Thread)

#### Scenario 3.1: Task Queue Management
- **Given**: Scheduler thread is running
- **When**: 10 tasks with different priorities are added
- **Then**: Tasks are executed in priority order
- **Then**: High-priority tasks execute before low-priority tasks

#### Scenario 3.2: Delayed Task Execution
- **Given**: Task scheduled for future execution
- **When**: Task with delay of 5 minutes is added
- **Then**: Task does not execute immediately
- **Then**: Task executes exactly at scheduled time (±1 second)

#### Scenario 3.3: Task Cancellation
- **Given**: Multiple tasks queued
- **When**: User cancels a pending task
- **Then**: Task is removed from queue
- **Then**: Subsequent tasks continue normally

### 4. File Operations (Storage Thread)

#### Scenario 4.1: Concurrent File Writes
- **Given**: Multiple articles ready for saving
- **When**: 10 file write operations requested simultaneously
- **Then**: Storage thread queues and processes them sequentially
- **Then**: All files are written successfully without corruption
- **Then**: No file locks or access conflicts occur

#### Scenario 4.2: Large File Handling
- **Given**: Article with 50+ images and large content
- **When**: Save operation initiated
- **Then**: File is written in chunks without blocking
- **Then**: Progress updates sent to main thread
- **Then**: Operation completes within reasonable time (< 60 seconds)

#### Scenario 4.3: File System Error Recovery
- **Given**: Storage thread attempting file operation
- **When**: File system error occurs (disk full, permissions)
- **Then**: Error is caught and reported gracefully
- **Then**: User receives actionable error message
- **Then**: Thread remains operational

### 5. Cross-Thread Communication

#### Scenario 5.1: Message Passing Reliability
- **Given**: All threads running
- **When**: 1000 messages sent between threads
- **Then**: All messages delivered successfully
- **Then**: No messages lost or duplicated
- **Then**: Message order preserved per sender-receiver pair

#### Scenario 5.2: Shared State Synchronization
- **Given**: SharedArrayBuffer for progress counters
- **When**: Multiple threads update counters simultaneously
- **Then**: All updates are atomic and consistent
- **Then**: No race conditions or data corruption
- **Then**: Main thread reads accurate values

#### Scenario 5.3: Thread Communication Timeout
- **Given**: Message sent to worker thread
- **When**: Worker thread does not respond within timeout (30s)
- **Then**: Main thread receives timeout error
- **Then**: Appropriate fallback action taken
- **Then**: User notified of issue

### 6. Performance and Stress Testing

#### Scenario 6.1: Resource Utilization
- **Given**: Application running with all threads
- **When**: System monitored during idle and active states
- **Then**: CPU usage < 5% when idle
- **Then**: Memory usage stable (no leaks)
- **Then**: CPU usage scales appropriately under load

#### Scenario 6.2: High Load Handling
- **Given**: Application at idle
- **When**: 100 articles generation requested
- **Then**: System remains responsive
- **Then**: Tasks complete within expected timeframes
- **Then**: No thread crashes or deadlocks

#### Scenario 6.3: Long-Running Operation
- **Given**: Writer thread generating complex content
- **When**: Operation takes 10+ minutes
- **Then**: UI remains responsive throughout
- **Then**: User can cancel operation at any time
- **Then**: Thread resources are properly cleaned up

## Test Cases

### Unit Tests

#### Test: Writer Thread Initialization
```javascript
describe('Writer Thread', () => {
  it('should initialize successfully', async () => {
    const thread = new WriterThread();
    await thread.start();
    expect(thread.isReady()).toBe(true);
  });
});
```

#### Test: Message Serialization
```javascript
it('should serialize/deserialize messages correctly', () => {
  const message = { type: 'GENERATE', data: { title: 'Test' } };
  const serialized = serializeMessage(message);
  const deserialized = deserializeMessage(serialized);
  expect(deserialized).toEqual(message);
});
```

#### Test: Task Priority Queue
```javascript
it('should execute high-priority tasks first', async () => {
  const scheduler = new SchedulerThread();
  scheduler.addTask({ priority: 1, id: 'low' });
  scheduler.addTask({ priority: 10, id: 'high' });
  const nextTask = await scheduler.getNextTask();
  expect(nextTask.id).toBe('high');
});
```

### Integration Tests

#### Test: End-to-End Article Generation
```javascript
it('should generate and save article through all threads', async () => {
  const result = await app.generateArticle({
    title: 'Test Article',
    keywords: ['test', 'integration']
  });
  expect(result.success).toBe(true);
  expect(result.filePath).toBeDefined();
  expect(fs.existsSync(result.filePath)).toBe(true);
});
```

#### Test: Concurrent Operations
```javascript
it('should handle multiple concurrent requests', async () => {
  const promises = Array(5).fill(null).map((_, i) => 
    app.generateArticle({ title: `Article ${i}` })
  );
  const results = await Promise.all(promises);
  expect(results.every(r => r.success)).toBe(true);
});
```

### Performance Tests

#### Test: Message Throughput
```javascript
it('should handle 1000 messages per second', async () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    await thread.postMessage({ type: 'PING', id: i });
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

#### Test: Memory Leak Detection
```javascript
it('should not leak memory during extended operation', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  for (let i = 0; i < 100; i++) {
    await app.generateArticle({ title: `Article ${i}` });
  }
  
  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;
  const growth = finalMemory - initialMemory;
  
  expect(growth).toBeLessThan(50 * 1024 * 1024); // < 50MB growth
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/thread-lifecycle.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run performance tests
npm test -- --grep "Performance"
```

## Continuous Integration

Tests are automatically run on:
- Every pull request
- Main branch commits
- Scheduled daily builds

### CI Pipeline Requirements
- All unit tests must pass
- Code coverage > 80%
- No performance regressions
- No memory leaks detected
