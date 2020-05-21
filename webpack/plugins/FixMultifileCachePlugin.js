const dependencyCache = new WeakMap();

module.exports = class FixMultifileCachePlugin {
    apply(compiler) {
        let invalidFileName;
        compiler.hooks.invalid.tap('FixMultifileCachePlugin', (fileName) => {
            invalidFileName = fileName;
        });
        compiler.hooks.normalModuleFactory.tap('FixMultifileCachePlugin', (normalModuleFactory) => {
            normalModuleFactory.create = function create(data, callback) {
                const dependencies = data.dependencies;
                const cacheEntry = dependencyCache.get(dependencies[0]);
                if (cacheEntry) {
                    if (invalidFileName && !invalidFileName.endsWith) {
                        console.log(typeof invalidFileName);
                        console.log(invalidFileName);
                        return callback(null, cacheEntry);
                    }

                    if (invalidFileName && invalidFileName.endsWith('.vue') && cacheEntry.resource === invalidFileName) {
                        // 看看能不能进一步缩小范围
                    } else
                        return callback(null, cacheEntry);
                }
                const context = data.context || this.context;
                const resolveOptions = Object.assign(data.resolveOptions || {}, {
                    // 找不到好方法去 hack 进去
                    unsafeCache: false,
                });
                const request = dependencies[0].request;
                const contextInfo = data.contextInfo || {};
                this.hooks.beforeResolve.callAsync(
                    {
                        contextInfo,
                        resolveOptions,
                        context,
                        request,
                        dependencies,
                    },
                    (err, result) => {
                        if (err)
                            return callback(err);

                        // Ignored
                        if (!result)
                            return callback();

                        const factory = this.hooks.factory.call(null);

                        // Ignored
                        if (!factory)
                            return callback();

                        factory(result, (err, module) => {
                            if (err)
                                return callback(err);

                            if (module && this.cachePredicate(module)) {
                                for (const d of dependencies) {
                                    dependencyCache.set(d, module);
                                }
                            }

                            callback(null, module);
                        });
                    },
                );
            };
        });
    }
};
