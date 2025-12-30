# RxJS: Complete Reference Guide

**RxJS (Reactive Extensions for JavaScript)** is a library for reactive programming using Observables, making it easier to compose asynchronous and event-based programs.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Installation & Setup](#installation--setup)
4. [Creation Operators](#creation-operators)
5. [Transformation Operators](#transformation-operators)
6. [Filtering Operators](#filtering-operators)
7. [Combination Operators](#combination-operators)
8. [Error Handling Operators](#error-handling-operators)
9. [Utility Operators](#utility-operators)
10. [Multicasting Operators](#multicasting-operators)
11. [Subjects](#subjects)
12. [Schedulers](#schedulers)
13. [Best Practices](#best-practices)

---

## Introduction

**Think of RxJS as Lodash for events.**

RxJS combines the **Observer pattern** with the **Iterator pattern** and **functional programming** to provide an ideal way of managing sequences of events.

### Key Benefits
- **Composable**: Chain operators to create complex async workflows
- **Declarative**: Express what you want, not how to get it
- **Pure functions**: Less prone to errors, easier to test
- **Powerful operators**: 100+ operators for any async scenario
- **Cancellation**: Built-in subscription management

### Version Information
- **Current Stable**: RxJS 7.8.x
- **Bundle Size**: ~50KB (smaller with tree-shaking)
- **TypeScript**: Full type support with improved inference

---

## Core Concepts

### 1. Observable
Represents an invokable collection of future values or events. Lazy Push collections of multiple values.

```javascript
import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});
```

### 2. Observer
A collection of callbacks that knows how to listen to values delivered by the Observable.

```javascript
const observer = {
  next: x => console.log('Observer got a next value: ' + x),
  error: err => console.error('Observer got an error: ' + err),
  complete: () => console.log('Observer got a complete notification')
};

observable.subscribe(observer);
```

### 3. Subscription
Represents the execution of an Observable. Primarily useful for cancelling execution.

```javascript
const subscription = observable.subscribe(x => console.log(x));

// Later: cancel subscription
subscription.unsubscribe();
```

### 4. Operators
Pure functions that enable a functional programming style for handling async operations.

```javascript
import { map, filter } from 'rxjs/operators';

observable.pipe(
  filter(x => x % 2 === 0),
  map(x => x * 2)
).subscribe(console.log);
```

### 5. Subject
A special type of Observable that allows multicasting to multiple Observers.

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

subject.subscribe(x => console.log('Observer A: ' + x));
subject.subscribe(x => console.log('Observer B: ' + x));

subject.next(1);
subject.next(2);
```

### 6. Schedulers
Centralized dispatchers to control concurrency.

---

## Installation & Setup

### NPM Installation
```bash
npm install rxjs
```

### CDN Usage
```html
<script src="https://unpkg.com/rxjs@7/dist/bundles/rxjs.umd.min.js"></script>
```

### Import Syntax (RxJS 7)
```javascript
// Named imports (tree-shakeable)
import { Observable, of, from, interval } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

// Usage
const source$ = of(1, 2, 3);
const result$ = source$.pipe(
  map(x => x * 2),
  filter(x => x > 2)
);
```

---

## Creation Operators

### `of()`
Creates an Observable from static values.

```javascript
import { of } from 'rxjs';

of(1, 2, 3, 4, 5).subscribe(console.log);
// Output: 1, 2, 3, 4, 5
```

### `from()`
Converts arrays, promises, iterables, or observables to an Observable.

```javascript
import { from } from 'rxjs';

// From array
from([1, 2, 3]).subscribe(console.log);

// From promise
from(fetch('/api/data')).subscribe(response => console.log(response));

// From iterable
from('hello').subscribe(char => console.log(char));
```

### `interval()`
Creates an Observable that emits sequential numbers every specified interval.

```javascript
import { interval } from 'rxjs';

interval(1000).subscribe(n => console.log(n));
// Output: 0, 1, 2, 3... (every second)
```

### `timer()`
Creates an Observable that waits, then emits numbers on an interval.

```javascript
import { timer } from 'rxjs';

// Delay 3 seconds, then emit every 1 second
timer(3000, 1000).subscribe(n => console.log(n));

// Emit once after 5 seconds
timer(5000).subscribe(() => console.log('Done!'));
```

### `fromEvent()`
Creates an Observable from DOM events or Node EventEmitter.

```javascript
import { fromEvent } from 'rxjs';

const clicks$ = fromEvent(document, 'click');
clicks$.subscribe(event => console.log('Clicked!', event));
```

### `ajax()` / `fetch()`
Create Observables from HTTP requests.

```javascript
import { ajax } from 'rxjs/ajax';

ajax.getJSON('/api/users').subscribe(
  users => console.log('Users:', users),
  error => console.error('Error:', error)
);
```

### `defer()`
Creates an Observable lazily when subscribed.

```javascript
import { defer, of } from 'rxjs';

const random$ = defer(() => of(Math.random()));

random$.subscribe(console.log); // Different value each subscription
```

### `range()`
Emits a sequence of numbers.

```javascript
import { range } from 'rxjs';

range(1, 10).subscribe(console.log);
// Output: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

### `empty()`, `EMPTY`
Creates an Observable that immediately completes.

```javascript
import { EMPTY } from 'rxjs';

EMPTY.subscribe({
  next: () => console.log('Next'),
  complete: () => console.log('Complete!')
});
// Output: Complete!
```

### `throwError()`
Creates an Observable that immediately emits an error.

```javascript
import { throwError } from 'rxjs';

throwError(() => new Error('Oops!')).subscribe({
  error: err => console.error('Error:', err.message)
});
```

---

## Transformation Operators

### `map()`
Transforms each value emitted by the source Observable.

```javascript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  map(x => x * 10)
).subscribe(console.log);
// Output: 10, 20, 30, 40, 50
```

### `switchMap()`
Maps to inner Observable, **cancels previous** inner Observable when new value arrives.

**Use when**: Latest value matters (autocomplete, search)

```javascript
import { fromEvent } from 'rxjs';
import { switchMap, debounceTime } from 'rxjs/operators';

const searchBox = document.querySelector('#search');
const search$ = fromEvent(searchBox, 'input');

search$.pipe(
  debounceTime(300),
  switchMap(event => fetch(`/api/search?q=${event.target.value}`))
).subscribe(results => console.log(results));
```

### `mergeMap()` / `flatMap()`
Maps to inner Observable, **maintains all** inner subscriptions concurrently.

**Use when**: All requests matter, order doesn't (parallel API calls)

```javascript
import { of } from 'rxjs';
import { mergeMap, delay } from 'rxjs/operators';

of(1, 2, 3).pipe(
  mergeMap(x => of(x * 10).pipe(delay(1000)))
).subscribe(console.log);
// Output: 10, 20, 30 (all roughly at same time after 1s)
```

### `concatMap()`
Maps to inner Observable, **waits for each to complete** before starting next.

**Use when**: Order matters, sequential processing (queue)

```javascript
import { of } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';

of(1, 2, 3).pipe(
  concatMap(x => of(x).pipe(delay(1000)))
).subscribe(console.log);
// Output: 1 (1s), 2 (2s), 3 (3s) - sequential
```

### `exhaustMap()`
Maps to inner Observable, **ignores new values** while inner Observable is active.

**Use when**: Prevent duplicate submissions (form submit, login button)

```javascript
import { fromEvent } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

const submitBtn = document.querySelector('#submit');

fromEvent(submitBtn, 'click').pipe(
  exhaustMap(() => fetch('/api/submit', { method: 'POST' }))
).subscribe(response => console.log('Submitted:', response));
```

### `scan()`
Accumulator function (like reduce, but emits intermediate values).

```javascript
import { of } from 'rxjs';
import { scan } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  scan((acc, val) => acc + val, 0)
).subscribe(console.log);
// Output: 1, 3, 6, 10, 15
```

### `reduce()`
Accumulator function (emits only final accumulated value).

```javascript
import { of } from 'rxjs';
import { reduce } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  reduce((acc, val) => acc + val, 0)
).subscribe(console.log);
// Output: 15
```

### `pluck()`
Maps to a property of the emitted object.

```javascript
import { of } from 'rxjs';
import { pluck } from 'rxjs/operators';

of(
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
).pipe(
  pluck('name')
).subscribe(console.log);
// Output: 'John', 'Jane'
```

### `buffer()`, `bufferTime()`, `bufferCount()`
Collect emissions into arrays.

```javascript
import { interval } from 'rxjs';
import { bufferTime, bufferCount } from 'rxjs/operators';

// Buffer every 2 seconds
interval(500).pipe(
  bufferTime(2000)
).subscribe(console.log);
// Output: [0,1,2,3], [4,5,6,7], ...

// Buffer every 3 items
interval(500).pipe(
  bufferCount(3)
).subscribe(console.log);
// Output: [0,1,2], [3,4,5], [6,7,8], ...
```

### `groupBy()`
Groups emissions by key function.

```javascript
import { of } from 'rxjs';
import { groupBy, mergeMap, toArray } from 'rxjs/operators';

of(
  { id: 1, type: 'A' },
  { id: 2, type: 'B' },
  { id: 3, type: 'A' },
  { id: 4, type: 'B' }
).pipe(
  groupBy(item => item.type),
  mergeMap(group => group.pipe(toArray()))
).subscribe(console.log);
// Output: [{id:1,type:'A'},{id:3,type:'A'}], [{id:2,type:'B'},{id:4,type:'B'}]
```

---

## Filtering Operators

### `filter()`
Emits values that pass a predicate function.

```javascript
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5, 6).pipe(
  filter(x => x % 2 === 0)
).subscribe(console.log);
// Output: 2, 4, 6
```

### `take()`
Emits only the first N values.

```javascript
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

interval(1000).pipe(
  take(5)
).subscribe(console.log);
// Output: 0, 1, 2, 3, 4 (then completes)
```

### `takeUntil()`
Emits values until a notifier Observable emits.

```javascript
import { interval, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');

interval(1000).pipe(
  takeUntil(clicks$)
).subscribe(console.log);
// Emits 0, 1, 2... until user clicks
```

### `takeWhile()`
Emits values while predicate is true.

```javascript
import { of } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

of(1, 2, 3, 4, 5, 1).pipe(
  takeWhile(x => x < 4)
).subscribe(console.log);
// Output: 1, 2, 3
```

### `skip()`
Skips the first N values.

```javascript
import { of } from 'rxjs';
import { skip } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  skip(2)
).subscribe(console.log);
// Output: 3, 4, 5
```

### `debounceTime()`
Emits a value only after a specified time has passed without another emission.

**Use when**: User input, search (wait for user to stop typing)

```javascript
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

fromEvent(searchInput, 'input').pipe(
  debounceTime(500)
).subscribe(event => console.log(event.target.value));
```

### `throttleTime()`
Emits a value, then ignores subsequent values for a duration.

**Use when**: Rate limiting, scroll events

```javascript
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

fromEvent(window, 'scroll').pipe(
  throttleTime(1000)
).subscribe(event => console.log('Scroll event'));
```

### `distinctUntilChanged()`
Emits only when the current value is different from the last.

```javascript
import { of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

of(1, 1, 2, 2, 2, 3, 3, 2).pipe(
  distinctUntilChanged()
).subscribe(console.log);
// Output: 1, 2, 3, 2
```

### `distinct()`
Emits values that have never been emitted before.

```javascript
import { of } from 'rxjs';
import { distinct } from 'rxjs/operators';

of(1, 2, 2, 3, 4, 1, 5).pipe(
  distinct()
).subscribe(console.log);
// Output: 1, 2, 3, 4, 5
```

### `first()`, `last()`
Emits only the first or last value.

```javascript
import { of } from 'rxjs';
import { first, last } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(first()).subscribe(console.log); // 1
of(1, 2, 3, 4, 5).pipe(last()).subscribe(console.log);  // 5
```

### `sample()`, `sampleTime()`
Samples the latest value at specified intervals.

```javascript
import { interval } from 'rxjs';
import { sampleTime } from 'rxjs/operators';

interval(500).pipe(
  sampleTime(2000)
).subscribe(console.log);
// Emits latest value every 2 seconds
```

---

## Combination Operators

### `combineLatest()`
Combines multiple Observables, emits when **any** emits (after all have emitted at least once).

```javascript
import { combineLatest, of } from 'rxjs';
import { delay } from 'rxjs/operators';

const obs1$ = of('A').pipe(delay(1000));
const obs2$ = of(1, 2, 3).pipe(delay(500));

combineLatest([obs1$, obs2$]).subscribe(console.log);
// Output: ['A', 3] (latest from both)
```

### `forkJoin()`
Waits for **all** Observables to complete, then emits final values.

**Use when**: Multiple HTTP requests, wait for all to finish

```javascript
import { forkJoin } from 'rxjs';
import { ajax } from 'rxjs/ajax';

forkJoin({
  users: ajax.getJSON('/api/users'),
  posts: ajax.getJSON('/api/posts')
}).subscribe(console.log);
// Output: { users: [...], posts: [...] }
```

### `merge()`
Merges multiple Observables into one, emitting **concurrently**.

```javascript
import { merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';

const obs1$ = interval(1000).pipe(map(x => `A${x}`));
const obs2$ = interval(1500).pipe(map(x => `B${x}`));

merge(obs1$, obs2$).subscribe(console.log);
// Output: A0, B0, A1, A2, B1, A3, B2, ...
```

### `concat()`
Concatenates Observables **sequentially** (waits for previous to complete).

```javascript
import { concat, of } from 'rxjs';
import { delay } from 'rxjs/operators';

const obs1$ = of(1, 2, 3).pipe(delay(1000));
const obs2$ = of(4, 5, 6);

concat(obs1$, obs2$).subscribe(console.log);
// Output: 1, 2, 3 (after 1s), then 4, 5, 6
```

### `zip()`
Combines Observables by **pairing** emissions (like a zipper).

```javascript
import { zip, of } from 'rxjs';

const age$ = of(27, 25, 29);
const name$ = of('John', 'Jane', 'Bob');

zip(name$, age$).subscribe(console.log);
// Output: ['John', 27], ['Jane', 25], ['Bob', 29]
```

### `withLatestFrom()`
Combines source with latest from other Observables when **source** emits.

```javascript
import { interval } from 'rxjs';
import { withLatestFrom, map } from 'rxjs/operators';

const source$ = interval(1000);
const other$ = interval(500);

source$.pipe(
  withLatestFrom(other$),
  map(([s, o]) => `Source: ${s}, Other: ${o}`)
).subscribe(console.log);
```

### `startWith()`
Emits specified value(s) before source emissions.

```javascript
import { of } from 'rxjs';
import { startWith } from 'rxjs/operators';

of('World').pipe(
  startWith('Hello')
).subscribe(console.log);
// Output: 'Hello', 'World'
```

### `pairwise()`
Emits the previous and current value as an array.

```javascript
import { of } from 'rxjs';
import { pairwise } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  pairwise()
).subscribe(console.log);
// Output: [1,2], [2,3], [3,4], [4,5]
```

---

## Error Handling Operators

### `catchError()`
Catches errors and returns a new Observable or rethrows.

```javascript
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

throwError(() => new Error('Oops!')).pipe(
  catchError(err => {
    console.error('Caught:', err.message);
    return of('Default value');
  })
).subscribe(console.log);
// Output: 'Default value'
```

### `retry()`
Resubscribes to source Observable on error.

```javascript
import { ajax } from 'rxjs/ajax';
import { retry } from 'rxjs/operators';

ajax.getJSON('/api/data').pipe(
  retry(3) // Retry up to 3 times
).subscribe({
  next: data => console.log(data),
  error: err => console.error('Failed after 3 retries:', err)
});
```

### `retry()` with config (RxJS 7+)
```javascript
import { retry } from 'rxjs/operators';

source$.pipe(
  retry({
    count: 3,
    delay: 1000,
    resetOnSuccess: true
  })
)
```

### `retryWhen()`
Custom retry logic based on error Observable.

```javascript
import { timer, throwError } from 'rxjs';
import { retryWhen, mergeMap } from 'rxjs/operators';

throwError(() => new Error('Failed')).pipe(
  retryWhen(errors =>
    errors.pipe(
      mergeMap((err, i) => 
        i < 3 ? timer((i + 1) * 1000) : throwError(() => err)
      )
    )
  )
).subscribe({
  next: val => console.log(val),
  error: err => console.error('Final error:', err)
});
// Retries after 1s, 2s, 3s, then fails
```

### `throwIfEmpty()`
Throws error if Observable completes without emitting.

```javascript
import { EMPTY } from 'rxjs';
import { throwIfEmpty } from 'rxjs/operators';

EMPTY.pipe(
  throwIfEmpty(() => new Error('No values!'))
).subscribe({
  error: err => console.error(err.message)
});
```

---

## Utility Operators

### `tap()`
Performs side effects without modifying the stream.

```javascript
import { of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

of(1, 2, 3).pipe(
  tap(x => console.log('Before:', x)),
  map(x => x * 10),
  tap(x => console.log('After:', x))
).subscribe();
// Before: 1, After: 10, Before: 2, After: 20, ...
```

### `tap()` with lifecycle hooks (RxJS 7.3+)
```javascript
tap({
  subscribe: () => console.log('Subscribed!'),
  next: val => console.log('Next:', val),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!'),
  unsubscribe: () => console.log('Unsubscribed!'),
  finalize: () => console.log('Finalized!')
})
```

### `delay()`
Delays emissions by specified time.

```javascript
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

of('Hello').pipe(
  delay(2000)
).subscribe(console.log);
// Prints 'Hello' after 2 seconds
```

### `timeout()`
Errors if no emission within specified time.

```javascript
import { of } from 'rxjs';
import { delay, timeout } from 'rxjs/operators';

of('Hello').pipe(
  delay(3000),
  timeout(2000)
).subscribe({
  error: err => console.error('Timeout!')
});
```

### `finalize()`
Callback when Observable completes, errors, or unsubscribes.

```javascript
import { of } from 'rxjs';
import { finalize } from 'rxjs/operators';

of(1, 2, 3).pipe(
  finalize(() => console.log('Cleanup!'))
).subscribe(console.log);
// Output: 1, 2, 3, Cleanup!
```

### `toArray()`
Collects all emissions into an array.

```javascript
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  toArray()
).subscribe(console.log);
// Output: [1, 2, 3, 4, 5]
```

### `defaultIfEmpty()`
Emits default value if source completes without emitting.

```javascript
import { EMPTY } from 'rxjs';
import { defaultIfEmpty } from 'rxjs/operators';

EMPTY.pipe(
  defaultIfEmpty('No values')
).subscribe(console.log);
// Output: 'No values'
```

### `count()`
Counts number of emissions.

```javascript
import { of } from 'rxjs';
import { count } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  count()
).subscribe(console.log);
// Output: 5
```

---

## Multicasting Operators

### `share()`
Shares a single subscription among multiple subscribers.

```javascript
import { interval } from 'rxjs';
import { share, take } from 'rxjs/operators';

const source$ = interval(1000).pipe(take(3), share());

source$.subscribe(x => console.log('Sub A:', x));
setTimeout(() => {
  source$.subscribe(x => console.log('Sub B:', x));
}, 1500);

// Both subscribers share the same execution
```

### `shareReplay()`
Shares subscription and replays N latest values to new subscribers.

```javascript
import { interval } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

const source$ = interval(1000).pipe(
  take(3),
  shareReplay(2) // Replay last 2 values
);

source$.subscribe(x => console.log('Sub A:', x));
setTimeout(() => {
  source$.subscribe(x => console.log('Sub B:', x));
  // Sub B immediately gets last 2 values
}, 3500);
```

### `multicast()`
Low-level multicasting operator.

```javascript
import { Subject, interval } from 'rxjs';
import { multicast, refCount } from 'rxjs/operators';

const source$ = interval(1000).pipe(
  multicast(() => new Subject()),
  refCount()
);
```

### `publish()`, `publishReplay()`, `publishLast()`
Specialized multicast variants (mostly replaced by `share` operators in RxJS 7).

---

## Subjects

### Subject
Basic Subject - multicast to multiple observers.

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

subject.subscribe(x => console.log('Observer A:', x));
subject.subscribe(x => console.log('Observer B:', x));

subject.next(1);
subject.next(2);
// Observer A: 1
// Observer B: 1
// Observer A: 2
// Observer B: 2
```

### BehaviorSubject
Requires initial value, emits current value to new subscribers.

**Use when**: Storing state (auth status, user profile)

```javascript
import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject(0);

subject.subscribe(x => console.log('Observer A:', x)); // Immediately gets 0

subject.next(1);
subject.next(2);

subject.subscribe(x => console.log('Observer B:', x)); // Immediately gets 2

// Observer A: 0
// Observer A: 1
// Observer A: 2
// Observer B: 2
```

### ReplaySubject
Replays last N values to new subscribers.

**Use when**: Recent history matters (chat messages, notifications)

```javascript
import { ReplaySubject } from 'rxjs';

const subject = new ReplaySubject(2); // Buffer 2 values

subject.next(1);
subject.next(2);
subject.next(3);

subject.subscribe(x => console.log('Observer A:', x));
// Immediately receives: 2, 3

subject.next(4);
// Observer A: 4
```

### AsyncSubject
Emits only the last value when completed.

**Use when**: Only final result matters (single HTTP request)

```javascript
import { AsyncSubject } from 'rxjs';

const subject = new AsyncSubject();

subject.subscribe(x => console.log('Observer A:', x));

subject.next(1);
subject.next(2);
subject.next(3);
subject.complete();

// Observer A: 3 (only after complete())
```

---

## Schedulers

Control when subscriptions start and notifications are delivered.

```javascript
import { of, asyncScheduler, asapScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

// Default: synchronous
of(1, 2, 3).subscribe(console.log);

// Async scheduler (setTimeout-like)
of(1, 2, 3, asyncScheduler).subscribe(console.log);

// ASAP scheduler (microtask)
of(1, 2, 3).pipe(
  observeOn(asapScheduler)
).subscribe(console.log);
```

---

## Best Practices

### 1. Always Unsubscribe
```javascript
import { Subscription } from 'rxjs';

const subscription = observable.subscribe(console.log);

// Later
subscription.unsubscribe();

// Or use takeUntil pattern
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

class Component {
  destroy$ = new Subject();

  ngOnInit() {
    observable.pipe(
      takeUntil(this.destroy$)
    ).subscribe(console.log);
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
```

### 2. Use Pipeable Operators
```javascript
// ✅ Good
observable.pipe(
  map(x => x * 2),
  filter(x => x > 10)
);

// ❌ Avoid
observable.map(x => x * 2).filter(x => x > 10); // Deprecated
```

### 3. Avoid Nested Subscriptions
```javascript
// ❌ Bad
obs1$.subscribe(x => {
  obs2$.subscribe(y => {
    console.log(x, y);
  });
});

// ✅ Good
obs1$.pipe(
  switchMap(x => obs2$.pipe(map(y => [x, y])))
).subscribe(([x, y]) => console.log(x, y));
```

### 4. Use Async Pipe in Angular
```typescript
// ✅ Good - auto unsubscribes
<div>{{ data$ | async }}</div>

// ❌ Avoid manual subscription in components
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}
```

### 5. Cold vs Hot Observables
```javascript
// Cold: Creates new execution for each subscriber
const cold$ = ajax.getJSON('/api/data');

// Hot: Shares execution among subscribers
const hot$ = ajax.getJSON('/api/data').pipe(share());
```

### 6. Error Handling
```javascript
// Always handle errors
observable.pipe(
  catchError(err => {
    console.error('Error:', err);
    return of(defaultValue);
  })
).subscribe();
```

### 7. Use Type Inference
```typescript
import { Observable } from 'rxjs';

const numbers$: Observable<number> = of(1, 2, 3);

// TypeScript will infer types
numbers$.pipe(
  map(x => x * 2) // x is number
).subscribe(x => console.log(x)); // x is number
```

---

## Common Patterns

### Debounced Search
```javascript
searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => searchAPI(term))
).subscribe(results => displayResults(results));
```

### Polling with Stop Condition
```javascript
import { interval, fromEvent } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

const stop$ = fromEvent(stopButton, 'click');

interval(5000).pipe(
  switchMap(() => fetchData()),
  takeUntil(stop$)
).subscribe(data => updateUI(data));
```

### Parallel HTTP Requests
```javascript
import { forkJoin } from 'rxjs';

forkJoin({
  users: getUsers(),
  posts: getPosts(),
  comments: getComments()
}).subscribe(({ users, posts, comments }) => {
  console.log(users, posts, comments);
});
```

### Retry with Exponential Backoff
```javascript
import { timer } from 'rxjs';
import { retryWhen, mergeMap } from 'rxjs/operators';

source$.pipe(
  retryWhen(errors =>
    errors.pipe(
      mergeMap((err, i) => 
        i < 3 ? timer(Math.pow(2, i) * 1000) : throwError(() => err)
      )
    )
  )
);
```

---

## Migration Notes (RxJS 6 → 7)

### Breaking Changes
- Operators moved to `rxjs/operators`
- No more `Observable.create()` - use `new Observable()`
- `toPromise()` replaced with `firstValueFrom()` / `lastValueFrom()`

### New Features in RxJS 7
- Smaller bundle size (~50% reduction)
- Better TypeScript types
- `timeout` operator improvements
- `retry` operator config object
- `connect` operator for multicasting

---

## Quick Operator Reference Table

| Category | Operators |
|----------|-----------|
| **Creation** | `of`, `from`, `fromEvent`, `interval`, `timer`, `ajax`, `defer`, `range`, `throwError` |
| **Transformation** | `map`, `switchMap`, `mergeMap`, `concatMap`, `exhaustMap`, `scan`, `reduce`, `pluck`, `buffer`, `groupBy` |
| **Filtering** | `filter`, `take`, `takeUntil`, `takeWhile`, `skip`, `debounceTime`, `throttleTime`, `distinctUntilChanged`, `distinct`, `first`, `last` |
| **Combination** | `combineLatest`, `forkJoin`, `merge`, `concat`, `zip`, `withLatestFrom`, `startWith`, `pairwise` |
| **Error Handling** | `catchError`, `retry`, `retryWhen`, `throwIfEmpty` |
| **Utility** | `tap`, `delay`, `timeout`, `finalize`, `toArray`, `defaultIfEmpty`, `count` |
| **Multicasting** | `share`, `shareReplay`, `multicast`, `publish` |

---

## Resources

- **Official Docs**: https://rxjs.dev
- **Learn RxJS**: https://learnrxjs.io
- **RxJS Marbles**: https://rxmarbles.com
- **RxViz**: https://rxviz.com
- **GitHub**: https://github.com/ReactiveX/rxjs
- **Operator Decision Tree**: https://rxjs.dev/operator-decision-tree

---

**Version**: RxJS 7.8.x  
**Last Updated**: November 2025  
**License**: Apache 2.0  
**Author**: Compiled from official documentation and community resources
