Package.describe({
  name: 'habitat-alerts',
  version: '1.0.0',
  summary: 'Alerts methods',
  git: '',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.addFiles('methods.alerts.js');
  api.addFiles('collection.alerts.js');
  api.export('Alerts');
});
