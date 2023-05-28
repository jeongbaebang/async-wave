<h1 align="center">
   <b>
      <img src="assets/promise-vigilant.png" alt="promise-vigilant logo" style="height: 500px; width:500px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">안전하게 실행할 수 있는 비동기 함수로서, 메서드 체인에서 일련의 콜백 함수를 순차적으로 실행하고,</p>
<p align="center">어떤 값이든 안전하게 프로미스로 변환하여 비동기 함수의 인자로 전달합니다.</p>

- [🇺🇸 English](./README-US.md)

## Table of Contents

- [Installing](#installing)
  - [Package manager](#package-manager)
  - [CDN](#cdn)
- [Usage](#Usage)
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
<script src="https://unpkg.com/promise-vigilant@1.3.0/dist/index.js"></script>
```

## Usage

```typescript
import { vigilAsync } from 'promise-vigilant';

// 원시값 전달했을 때
vigilAsync(10, [async (num) => num + 5, (num) => num + 20], {
  onSuccess: (result) => {
    console.log(result); // 35
  },
});

// 일반 함수를 전달했을 때
vigilAsync(() => 10, [(num) => num + 5, async (num) => num + 20], {
  onSuccess: (result) => {
    console.log(result); // 35
  },
});

// 비동기 함수를 전달했을 때
vigilAsync(async () => 10, [(num) => num + 5, (num) => num + 20], {
  onSuccess: (result) => {
    console.log(result); // 35
  },
});

// 에러가 캐치되어 외부 컨텍스트로 에러가 방출되지 않습니다. (처리된 에러)
vigilAsync(
  10,
  [
    () => {
      throw new Error('new Error!');
    },
    (num) => num + 20,
  ],
  {
    onError: (error) => {
      console.log(error.message); // new Error!
    },
  }
);

// onError 옵션을 사용하지 않으면 에러가 외부로 방출됩니다.
(async function () {
  try {
    await vigilAsync(10, [
      () => {
        throw new Error('new Error2!');
      },
      (num) => num + 20,
    ]);
  } catch (error: any) {
    console.log(error.message); // new Error2!
  }
})();

// 외부 API와 함께 사용
vigilAsync(placeId, [requestPlaceDetailResultAPI, createAddress], {
  onError: () => {
    return mapErrorHandler(location, ErrorType.network);
  },
  onSuccess: (data) => {
    cache.set(data.place_id, data);
  },
});
```

### Parameters

- startValue: 프로미스화하려는 첫 번째 값입니다. 값이 함수가 아니거나 프로미스가 아니라면 자동으로 프로미스를 반환하는 함수로 변환시킵니다.

**참고: 첫번째 인수는 어떤 값을 전달하든 항상 프로미스로 감싸져서 전달됩니다.**

- callbackFns: then 메소드에서 실행할 콜백 함수의 배열입니다.
- option (optional): onError, onSuccess 및 onSettled 콜백 함수를 제공하는 데 사용할 수 있는 선택적 객체입니다.
  - onError: 프로미스가 거부된 상태에 도달했을 때 트리거되는 함수입니다.
  - onSuccess: 프로미스가 해결된 상태에 도달했을 때 트리거되는 함수입니다. 마지막 프로미스의 결과가 인수로 전달됩니다.
  - onSettled: 프로미스가 해결되거나 거부 두 개의 상태 중 하나가 되었을 때 트리거 되는 함수입니다.

### Return Value

체인에서 마지막 프로미스의 결과를 반환하는 Promise 객체입니다.

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
