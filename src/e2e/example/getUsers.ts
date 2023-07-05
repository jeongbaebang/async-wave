import axios from 'axios';
import { Response } from '../../mocks/type';

export async function getUser() {
  const { data } = await axios.get<Response>('/api/v1/users');

  return data;
}
