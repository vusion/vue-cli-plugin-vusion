const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const spawnSync = require('child_process').spawnSync;
const exec = (command, onError) => {
    const argv = command.split(/\s+/);
    const result = spawnSync(argv[0], argv.slice(1), { shell: true, stdio: 'inherit' });
    if (result.status) {
        onError && onError();
        process.exit(1);
    }
};

/**
 * git clone and run commands
 * @param {string} gitPath - Git Path
 * @param {Array<string>} commands - Commands to run
 * @param {string} options.branch - Which git branch
 */
function cloneAndRun(gitPath, commands, options) {
    if (!Array.isArray(commands))
        commands = [commands];
    options = Object.assign({
        branch: 'master',
    }, options);

    const tmpPath = path.resolve(__dirname, '../tmp');
    shell.cd(tmpPath);

    const name = path.basename(gitPath, '.git') + '-' + new Date().toJSON().slice(0, -5).replace(/:/g, '-');
    exec(`git clone ${gitPath} --depth 1 --branch ${options.branch} ` + name);
    shell.rm('-rf', '.git');
    shell.cd(name);

    // 由于 vue-cli-plugin-vusion 在外面，所以
    let packageJSON = fs.readFileSync('package.json', 'utf8');
    packageJSON = packageJSON.replace(/"vue-cli-plugin-vusion":.+,/, '"vue-cli-plugin-vusion": "../../../",');
    fs.writeFileSync('package.json', packageJSON, 'utf8');
    // shell.cd('node_modules');
    // shell.rm('-rf', 'vue-cli-plugin-vusion');
    // shell.ln('-s', '../../../../', 'vue-cli-plugin-vusion');
    // shell.cd('../');

    const final = () => {
        shell.cd('../');
        shell.rm('-rf', name);
    };

    exec('npm i', final);
    commands.forEach((command) => exec(command, final));

    final();
}

module.exports = cloneAndRun;
module.exports.exec = exec;
