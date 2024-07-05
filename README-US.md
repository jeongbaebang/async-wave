<h1 align="center">
   <b>
      <img src="assets/async-wave.png" alt="async-wave logo" style="height: 300px; width:300px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">`async-wave` is a safely executed asynchronous function that sequentially executes a chain of callback functions and returns the result. It safely transforms any value into a Promise and passes it as an argument to the asynchronous function. This allows for easy management of asynchronous operations and returning of results. Additionally, `asyncWave` provides intuitive implementation of error handling, success handling, and other logic through callback functions. This enables developers to write safe and efficient asynchronous code.</p>

- [🇰🇷 한국어](./README.md)

## Table of Contents

- [Installing](#installing)
  - [Package manager](#package-manager)
  - [CDN](#cdn)
- [Usage](#usage)

## Installing

### Package manager

Using npm:

```bash
$ npm install async-wave
```

Using yarn:

```bash
$ yarn add async-wave
```

### CDN

Using unpkg CDN:

```html
<script src="https://unpkg.com/async-wave@{{VERSION}}/dist/index.js"></script>
```

# Usage

### Before

```ts
// Promises chaining
await setFetchLog();
startLoadingIndicator();
getGithubUser(USER_NAME)
  .then(loadJson)
  .then(showAvatar)
  .then((githubUser) => console.log(`avatar_url: ${githubUser.avatar_url}`))
  .catch((error) => console.error(error))
  .finally(endLoadingIndicator);
```

### After

```typescript
import { asyncWave } from 'async-wave';

// if a function is passed as the first argument and its return value is not a promise, an error will be thrown.
asyncWave<GithubUser>([USER_NAME, getGithubUser, loadJson], {
  onBefore: async () => {
    await setFetchLog(); // Errors inside the handler are also caught! [1]
    startLoadingIndicator();
  },
  onSuccess: async (githubUser) => {
    await showAvatar(githubUser); // Errors inside the handler are also caught! [2]
    console.log(`avatar_url: ${githubUser.avatar_url}`);
  },
  onError: (error) => {
    console.error(error);
  },
  onSettled: () => {
    endLoadingIndicator();
  },
});
```

### Parameters

- callbacks: An array of callback functions to be executed in the then method. (**Note: If a function is passed as the first argument and its return value is not a promise, an error will be thrown.**)
- option (optional): An optional object that provides the following callback functions:
  - onBefore: A function that runs before the promise starts. This function must be passed to the async function.
  - onError: A function triggered when the promise reaches a rejected state.
  - onSuccess: A function triggered when the promise reaches a resolved state. The result of the last promise is passed as an argument to this function.
  - onSettled: A function triggered when the promise reaches either a resolved or a rejected state.

### Return Value

A Promise object that returns the result of the last promise in the chain.
