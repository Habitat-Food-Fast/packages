Package.describe({
  name: 'habitat-prospects',
  version: '1.0.0',
  summary: 'Prospects collection stuff',
});

Npm.depends({
  "simpl-schema": "0.3.1"
});
Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('ecmascript');
  api.use('underscore');
  api.use('aldeed:collection2-core');
  api.use('mongo', ['client', 'server']);
  api.use('mdg:validated-method', ['client', 'server']);
  api.use('didericis:permissions-mixin');
  api.addFiles('collection.prospects.js', ['client', 'server']);
  api.addFiles('methods.prospects.js', ['client', 'server']);
  api.addFiles('schema.prospects.js', ['client', 'server']);
  api.export('Prospects');
});
