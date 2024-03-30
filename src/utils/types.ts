export type OnError = (error: any) => void;

export type OnSuccess<T> = (received: T) => void;

export type OnSettled = () => void;

export type OnBefore = () => void;

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
