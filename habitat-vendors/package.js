Package.describe({
  name: 'habitat-vendors',
  summary: 'Businessprofiles collection stuff',
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
  api.use('random');
  api.use('aldeed:collection2-core');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('alanning:roles');
  api.use('didericis:permissions-mixin');
  api.addFiles('collection.businessProfiles.js', ['client', 'server']);
  api.addFiles('methods.businessProfiles.js', ['client', 'server']);
  api.addFiles('schema.businessProfiles.js', ['client', 'server']);
  api.export('businessProfiles');
});
