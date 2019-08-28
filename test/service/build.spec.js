const run = require('../fixtures/run');

describe('vue-cli-service build', () => {
    it('web-app', () => {
        run('https://github.com/vusion-templates/web-app.git', 'npm run build');
    });
});
