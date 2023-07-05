<h1 align="center">
   <b>
      <img src="assets/promise-vigilant.png" alt="promise-vigilant logo" style="height: 500px; width:500px; border-radius: 50px;"/><br>
   </b>
</h1>

<p align="center">`vigilAsync` is a safely executed asynchronous function that sequentially executes a chain of callback functions and returns the result. It safely transforms any value into a Promise and passes it as an argument to the asynchronous function. This allows for easy management of asynchronous operations and returning of results. Additionally, `vigilAsync` provides intuitive implementation of error handling, success handling, and other logic through callback functions. This enables developers to write safe and efficient asynchronous code.</p>

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
vigilAsync([10, async (num) => num + 5, (num) => num + 20], {
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
vigilAsync([() => 10, (num) => num + 5, async (num) => num + 20], {
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
vigilAsync(
  [
    10,
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

vigilAsync([placeId, requestPlaceDetailResultAPI, createAddress], {
  onError: () => {
    return mapErrorHandler(placeId, ErrorType.network);
  },
  onSuccess: (data) => {
    cache.set(data.place_id, data);
  },
});
```

### Parameters

- startValue: The first value to be promisified. If the value is not a function or a promise, it will be automatically converted into a function that returns a promise.

**Note: If a function is passed as the first argument and its return value is not a promise, an error will be thrown.**

- callbacks: An array of callback functions to be executed in the then method.
- option (optional): An optional object that provides the following callback functions:
  - onError: A function triggered when the promise reaches a rejected state.
  - onSuccess: A function triggered when the promise reaches a resolved state. The result of the last promise is passed as an argument to this function.
  - onSettled: A function triggered when the promise reaches either a resolved or a rejected state.

### Return Value

A Promise object that returns the result of the last promise in the chain.

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
