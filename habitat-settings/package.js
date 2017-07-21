Package.describe({
  name: 'habitat-settings',
  summary: 'Settings collection stuff',
  version: '1.0.6'
});

Npm.depends({
  'simpl-schema': '0.3.1',
})
Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('check');
  api.use('aldeed:collection2-core');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('habitat-calc');
  api.addFiles('collection.settings.js', ['client', 'server']);
  api.addFiles('methods.settings.js', ['client', 'server']);
  api.addFiles('schema.settings.js', ['client', 'server']);
  api.export('Settings');
});
