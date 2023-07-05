import { rest } from 'msw';

import { Response } from './type';
import { payload } from './db';

const DEFUALT_URL = 'http://localhost';

export const handlers = [
  rest.get<Response>(`${DEFUALT_URL}/api/v1/users`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total: 10,
        payload: payload,
      })
    );
  }),
];
