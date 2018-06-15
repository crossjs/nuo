declare type resolveFunc = (value?: any) => any;
declare type rejectFunc = (reason?: any) => any;
declare type notifyFunc = (sofar?: any) => any
declare type PromiseFunc = (
  resolve: resolveFunc,
  reject: rejectFunc,
  notify: notifyFunc) => void
