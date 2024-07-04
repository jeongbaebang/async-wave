import type { PromiseCircularityError } from '../utils';

export type OnError = (error: PromiseCircularityError) => void;

export type OnSuccess<T> = (received: T) => void;

export type OnSettled = () => void;

export type OnBefore = () => Promise<void>;

export interface Option<T> {
  onError: OnError;
  onSuccess: OnSuccess<T>;
  onSettled: OnSettled;
  onBefore: OnBefore;
}

export type StartValue<SV> =
  | Exclude<SV, () => any>
  | (() => Promise<SV>)
  | (() => SV);

export type CallbackFns = any[];

export type Options<R> = Partial<Option<R>>;
