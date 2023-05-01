export type OnError = (error: any) => void;

export type OnSuccess<T> = (received: T) => void;

export interface Option<T> {
  onError: OnError;
  onSuccess: OnSuccess<T>;
}

export type StartValue<SV> = Exclude<SV, () => any> | (() => Promise<SV>);

export type CallbackFns = ((value: any) => any)[];

export type Options<R> = Partial<Option<R>>;
