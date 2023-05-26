<h1 align="center">
   <b>
      <img src="assets/promise-vigilant.png" alt="promise-vigilant logo" style="height: 500px; width:500px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">A utility for safely executing a series of callback functions in an asynchronous method chain.</p>

- [🇰🇷 한국어](./README.md)

## Table of Contents

- [Installing](#installing)
  - [Package manager](#package-manager)
  - [CDN](#cdn)
- [Usage](#usage)
- [Example](#example)

## Installing

### Package manager

Using npm:

```bash
$ npm install promise-vigilant
```

Using yarn:

```bash
$ yarn add promise-vigilant
```

### CDN

Using unpkg CDN:

```html
<script src="https://unpkg.com/promise-vigilant@1.1.3/dist/index.js"></script>
```

## Usage

```typescript
import { vigilAsync } from 'promise-vigilant';

vigilAsync(startValue, [callbackFn1, callbackFn2], {
  onError: () => {
    // Handle error
  },
  onSuccess: (data) => {
    // Handle success
  },
});
```

### Parameters

- startValue: The first value to be promisified. If the value is not a function, it will be promisified using the `promisify` utility function.

**Note: If a function is passed as the first argument and its return value is not a promise, an error will be thrown.**

- callbackFns: An array of callback functions to be executed in the `then` method.
- options (optional): An optional object that can provide `onError` and `onSuccess` callback functions.
  - onError: A function triggered when the promise reaches the rejected state.
  - onSuccess: A function triggered when the promise reaches the resolved state. The result of the last promise is passed as an argument.
  - onSettled: A function triggered when the promise reaches either the resolved or rejected state.

### Return Value

A Promise object that returns the result of the last promise in the chain.

## Example

Without **promise-vigilant**

```ts
import axios from 'axios';

async function saveUserData() {
  try {
    const users = await axios({
      method: 'get',
      url: 'https://jsonplaceholder.typicode.com/users',
    });
    const userIds = users.data.map((data) => data.id);
    const userPostPromise = userIds.map((id) =>
      axios({
        method: 'get',
        url: `https://jsonplaceholder.typicode.com/posts/${id}`,
      })
    );
    const userPost = await Promise.all(userPostPromise);
    const userPostTitle = userPost.map(({ data }) => data.title);

    saveDB(userPostTitle);
  } catch (error) {
    sendReport(error);
  } finally {
    changeLoadingState();
  }
}
```

With **promise-vigilant**

```ts
import { vigilAsync } from 'promise-vigilant';

function saveUserData() {
  vigilAsync(
    requestUserList,
    [getUserIds, setPostPromise, requestUserPost, getPostTitle],
    {
      onError: (error) => sendReport(error),
      onSuccess: () => saveDB(),
      onSettled: () => changeLoadingState(),
    }
  );
}
```

## License

[MIT](https://github.com/jeongbaebang/promise-vigilant/blob/main/LICENSE)
