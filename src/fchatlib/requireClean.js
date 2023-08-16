"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//const { default: callerPath } = require("caller-path");
let _ = require("lodash");
let path = require("path");
let resolveFrom = require("resolve-from");
//let callerPath = require("caller-path");
let callerPath;
import("../../node_modules/caller-path/index.js").then(callerpath => this.callerPath = callerpath);
class RequireClean {
    constructor(name, deep = null) {
        this.deleteMod = function (mod) {
            return delete require.cache[mod.id];
        };
        this.clean = function (name, deep) {
            if (deep == null) {
                deep = true;
            }
            if (_.isUndefined(name)) {
                return _.each(require.cache, function (v, key) {
                    return delete require.cache[key];
                });
            }
            else {
                if (!_.isString(name)) {
                    throw new TypeError("requireClean.clean Expects a moduleId String");
                }
                return this.searchCache(name, callerPath(), deep, this.deleteMod);
            }
        };
        this.searchCache = function (name, calledFrom, deep, callback) {
            var mod, run;
            mod = resolveFrom(path.dirname(calledFrom), name);
            if (mod && (mod = require.cache[mod]) !== void 0) {
                return (run = function (mod) {
                    if (deep) {
                        mod.children.forEach(function (child) {
                            return run(child);
                        });
                    }
                    return callback(mod);
                })(mod);
            }
        };
        var cp;
        if (deep == null) {
            deep = true;
        }
        if (!_.isString(name)) {
            throw new TypeError("requireClean expects a moduleId String");
        }
        cp = callerPath();
        this.searchCache(name, cp, deep, this.deleteMod);
        return require(resolveFrom(path.dirname(cp), name));
    }
}
exports.default = RequireClean;
;
//# sourceMappingURL=requireClean.js.map