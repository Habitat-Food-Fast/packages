Package.describe({
  name: "habitat-runner",
  summary: "runner collection stuff",
  version: "1.0.6"
});

Npm.depends({
  "moment": "2.18.1",
})

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('check');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('iron:router');
  api.use('habitat-calc');
  api.addFiles('runner.js', ['client', 'server']);
  api.export('runner');
  api.export('staffJoy');
  api.export('runnerPayout');
});
