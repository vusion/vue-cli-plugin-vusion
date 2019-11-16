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
                    if (invalidFileName.endsWith('.vue') && cacheEntry.resource === invalidFileName) {
                        //
                    } else
                        return callback(null, cacheEntry);
                }
                const context = data.context || this.context;
                const resolveOptions = Object.assign(data.resolveOptions || {}, {
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
                    }
                );
            };
        });
    }
};
