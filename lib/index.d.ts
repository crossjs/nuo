import Handler from "./handler";
declare class Nuo {
    static resolve: (value: any) => any;
    static reject: (value: any) => Nuo;
    static notify: (value: any) => Nuo;
    static all: (values: any[]) => Nuo;
    static race: (values: any[]) => Nuo;
    static any: (values: any[]) => Nuo;
    state: number;
    value: any;
    sofar: any;
    deferred: Handler[];
    constructor(fn: PromiseFunc);
    catch(onRejected: rejectFunc): Nuo;
    finally(done: () => any): Nuo;
    progress(onProgress: notifyFunc): Nuo;
    then(onFulfilled?: resolveFunc, onRejected?: rejectFunc, onProgress?: notifyFunc): Nuo;
    private handle;
    private finale;
    private resolve;
    private reject;
    private notify;
}
export default Nuo;
