import type { PromiseCircularityError } from '../utils';

export type OnError = (error: PromiseCircularityError) => void;

export type OnSuccess<T> = (received: T) => void | T | any;

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

// Builder pattern types
export type AsyncFunction<T = any, R = any> = (value: T) => R | Promise<R>;

export type AsyncChainFunction = AsyncFunction<any, any>;

// Helper type to extract the return type of a function (unwrapping Promise)
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Helper type for function return type
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R
  ? UnwrapPromise<R>
  : T;
