Package.describe({
  name: "habitat-tasks",
  summary: "Some tasks",
  version: "1.0.0"
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('matteodem:easy-search');
  api.use('check');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('mdg:validated-method');
  api.use('tunifight:loggedin-mixin');

  api.addFiles('tasks.js', ['client', 'server']);
  api.export('Tasks');
});
