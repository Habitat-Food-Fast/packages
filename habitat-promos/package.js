Package.describe({
  name: "habitat-promos",
  summary: "Promos collection",
  version: "1.0.6"
});

Npm.depends({
  "simpl-schema": "0.3.1"
});
Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('mdg:validated-method');
  api.use('matteodem:easy-search');
  api.use('aldeed:collection2-core');
  api.use('momentjs:moment');
  api.use('didericis:permissions-mixin', ['client', 'server']);
  api.addFiles('collection.instances.js', ['client', 'server']);
  api.addFiles('methods.instances.js', ['client', 'server']);
  api.addFiles('schema.instances.js', ['client', 'server']);
  api.addFiles('types.instances.js', ['client', 'server']);
  api.addFiles('util.instances.js', ['client', 'server']);
  api.export('Instances');
});
