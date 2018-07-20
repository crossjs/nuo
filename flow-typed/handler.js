// @flow

declare type promiseCallback = (value?: any) => any;
declare type promiseExecuter = (value?: any) => void;

declare type promiseFunction = (
  resolve: promiseExecuter,
  reject: promiseExecuter,
  notify: promiseExecuter
) => void
