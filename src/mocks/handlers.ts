import { rest } from 'msw';

import { Response } from './type';
import { payload } from './db';

const DEFAULT_URL = 'http://localhost';

export const handlers = [
  rest.get<Response>(`${DEFAULT_URL}/api/v1/users`, (req, res, ctx) => {
    const isError = req.url.searchParams.get('isError');

    if (isError) {
      return res(
        ctx.status(403),
        // And a response body, if necessary
        ctx.json({
          errorMessage: `User not found`,
        }),
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        total: 10,
        payload: payload,
      }),
    );
  }),
];
