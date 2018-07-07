declare type notifyFunc = (sofar?: any) => any;
export default class Handler {
    onFulfilled: resolveFunc | null;
    onRejected: rejectFunc | null;
    onProgress: notifyFunc | null;
    resolve: resolveFunc;
    reject: rejectFunc;
    notify: notifyFunc;
    constructor(onFulfilled: resolveFunc | null, onRejected: rejectFunc | null, onProgress: notifyFunc | null, resolve: resolveFunc, reject: rejectFunc, notify: notifyFunc);
}
export {};
