<h1 align="center">
   <b>
      <img src="assets/promise-vigilant.png" alt="promise-vigilant logo" style="height: 500px; width:500px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">vigilAsync은 안전하게 실행되는 비동기 함수로, 콜백 함수들을 메서드 체인으로 연결하여 순차적으로 실행하고 처리 결과를 반환합니다. 프로미스로 안전하게 변환되어 비동기 함수의 인자로 전달되므로, 다양한 비동기 작업을 간편하게 처리할 수 있습니다. 이를 통해 안전하고 효율적인 비동기 코드 작성이 가능합니다.</p>

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
import { vigilAsync } from 'vigil-async';

// Example 1: Basic Usage
vigilAsync(10, [async (num) => num + 5, (num) => num + 20], {
  onSuccess: (result) => {
    console.log(result); // 35
  },
});

// Example 2: Using Functions and Async Functions
vigilAsync(() => 10, [(num) => num + 5, async (num) => num + 20], {
  onSuccess: (result) => {
    console.log(result); // 35
  },
});

// Example 3: Handling Errors
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

// Example 4: Propagating Errors to External Context
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

// Example 5: Using with External API and Options
const placeId = '12345';
const requestPlaceDetailResultAPI = async (placeId: string) => {
  // Request place detail results from an API
  return fetch(`https://api.example.com/places/${placeId}`)
    .then((response) => response.json())
    .catch((error) => {
      throw new Error(`Failed to fetch place details: ${error.message}`);
    });
};
const createAddress = async (placeDetails: any) => {
  // Process place details and create an address
  return `${placeDetails.street}, ${placeDetails.city}, ${placeDetails.country}`;
};
const mapErrorHandler = (location: string, errorType: string) => {
  // Handle and map errors
  console.log(`Error occurred at location: ${location}, Type: ${errorType}`);
};

vigilAsync(placeId, [requestPlaceDetailResultAPI, createAddress], {
  onError: () => {
    return mapErrorHandler(placeId, ErrorType.network);
  },
  onSuccess: (data) => {
    cache.set(data.place_id, data);
  },
});
```

### Parameters

- startValue: 프로미스로 변환될 첫 번째 값입니다. 만약 이 값이 함수나 프로미스가 아닌 경우, 자동으로 프로미스를 반환하는 함수로 변환됩니다. 첫 번째 인자로 전달된 값은 어떤 값이든 프로미스로 감싸져서 전달됩니다.

**참고: 첫번째 인수는 어떤 값을 전달하든 항상 프로미스로 감싸져서 전달됩니다.**

- callbacks: then 메서드에서 실행할 콜백 함수들의 배열입니다.
- option (선택 사항): 다음 콜백 함수들을 제공하는 선택적인 객체입니다:
  - onError: 프로미스가 거부된 상태에 도달했을 때 실행되는 함수입니다.
  - onSuccess: 프로미스가 해결된 상태에 도달했을 때 실행되는 함수입니다. 마지막 프로미스의 결과가 이 함수의 인자로 전달됩니다.
  - onSettled: 프로미스가 해결되거나 거부된 상태에 도달했을 때 실행되는 함수입니다.

### Return Value

체인에서 마지막 프로미스의 결과를 반환하는 Promise 객체입니다.

## Example

With **promise-vigilant**

```ts
import { vigilAsync } from 'vigil-async';

// Example 1: Using startVal, callbacks, and option
const placeId = '12345';
const getPlaceDetailResult = async (placeId: string) => {
  // Fetch place details from an API
  return fetch(`https://api.example.com/places/${placeId}`)
    .then((response) => response.json())
    .catch((error) => {
      throw new Error(`Failed to fetch place details: ${error.message}`);
    });
};
const createAddress = async (placeDetails: any) => {
  // Process place details and create an address
  return `${placeDetails.street}, ${placeDetails.city}, ${placeDetails.country}`;
};
const mapErrorHandler = (location: string, errorType: string) => {
  // Handle and map errors
  console.log(`Error occurred at location: ${location}, Type: ${errorType}`);
};

vigilAsync(placeId, [getPlaceDetailResult, createAddress], {
  onError: () => {
    return mapErrorHandler(placeId, 'network');
  },
  onSuccess: (data) => {
    console.log('Place details:', data);
    // Store place details in a cache
  },
})
  .then((result) => {
    console.log('Final result:', result);
  })
  .catch((error) => {
    console.error('Error:', error);
  });

// Example 2: Using only callbacks and option
const fetchData = async () => {
  // Fetch data from an API
  return fetch('https://api.example.com/data')
    .then((response) => response.json())
    .catch((error) => {
      throw new Error(`Failed to fetch data: ${error.message}`);
    });
};
const processData = async (data: any) => {
  // Process data
  return data.map((item: any) => item.name);
};
const handleSuccess = (result: string[]) => {
  console.log('Processed data:', result);
  // Do something with the processed data
};
const handleError = (error: Error) => {
  console.error('Error occurred:', error);
  // Handle the error
};

vigilAsync([fetchData, processData], {
  onError: handleError,
  onSuccess: handleSuccess,
})
  .then((result) => {
    console.log('Final result:', result);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

## License

[MIT](https://github.com/jeongbaebang/promise-vigilant/blob/main/LICENSE)
