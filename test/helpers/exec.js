const spawnSync = require('child_process').spawnSync;
/**
 * 使用 spawn inherit，直接打印 stdio
 */
module.exports = (command, onError) => {
    [command, ...args] = command.split(/\s+/);
    const result = spawnSync(command, args, { shell: true, stdio: 'inherit' });
    if (result.status) {
        onError && onError(result);
        process.exit(1);
    }
};
