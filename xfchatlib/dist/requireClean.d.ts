export default class RequireClean {
    deleteMod: (mod: any) => boolean;
    constructor(name: any, deep?: any);
    clean: (name: any, deep: any) => any;
    searchCache: (name: any, calledFrom: any, deep: any, callback: any) => any;
}
