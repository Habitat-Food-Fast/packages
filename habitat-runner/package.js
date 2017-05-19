Package.describe({
  name: "habitat-runner",
  summary: "runner collection stuff",
  version: "1.0.6"
});

Package.onUse(function (api) {
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('check');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('iron:router');
  api.use('rocketchat:streamer');
  api.use('habitat-calc');
  api.addFiles('runner.js', ['client', 'server']);
  api.export('runner');
  api.export('staffJoy');
  api.export('runnerPayout');
});
