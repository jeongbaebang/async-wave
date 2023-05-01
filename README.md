<h1 align="center">
   <b>
      <img src="assets/promise-vigilant.png" alt="promise-vigilant logo" style="height: 500px; width:500px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">메서드 체인에서 일련의 콜백 함수를 안전하게 실행할 수 있는 비동기 
## 목차

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
<script src="https://unpkg.com/promise-vigilant@1.0.0/dist/index.js"></script>
```

## Usage

```typescript
import vigilAsync from 'promise-vigilant';

vigilAsync(placeId, [getPlaceDetailResult, createAddress], {
  onError: () => {
    return mapErrorHandler(location, ErrorType.network);
  },
  onSuccess: (data) => {
    cache.set(data.place_id, data);
  },
});
```

### Parameters

- startValue: 프로미스화하려는 첫 번째 값입니다. 값이 함수가 아닌 경우 promisify 유틸리티 함수를 사용하여 프로미스화됩니다.

**참고: 첫 번째 인수로 함수를 전달하고 해당 함수의 반환 값이 프로미스가 아닌 경우 오류가 발생합니다.**

- callbackFns: then 메소드에서 실행할 콜백 함수의 배열입니다.
- option (optional): onError 및 onSuccess 콜백 함수를 제공하는 데 사용할 수 있는 선택적 객체입니다.
  - onError: 프로미스가 거부된 상태에 도달했을 때 트리거되는 함수입니다.
  - onSuccess: 프로미스가 해결된 상태에 도달했을 때 트리거되는 함수입니다. 마지막 프로미스의 결과가 인수로 전달됩니다.

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
const getUserIds = ({ data }) => data.map((user) => user.id);

const getPostTitle = (post) => post.map(({ data }) => data.title);

const requestUserList = () => {
  return axios({
    method: 'get',
    url: 'https://jsonplaceholder.typicode.com/users',
  });
};

const setPostPromise = (ids) =>
  ids.map((id) => {
    return axios<Post>({
      method: 'get',
      url: `https://jsonplaceholder.typicode.com/posts/${id}`,
    });
  });

const requestUserPost = (userPostPayload: Promise<Post>[]) =>
  Promise.all(userPostPayload);

function saveUserData() {
  vigilAsync(
    requestUserList,
    [getUserIds, setPostPromise, requestUserPost, getPostTitle, saveDB],
    {
      onError: (error) => sendReport(error),
      onSuccess: () => changeLoadingState(),
    }
  );
}
```

## License

[MIT](https://github.com/jeongbaebang/promise-vigilant/blob/main/LICENSE)
