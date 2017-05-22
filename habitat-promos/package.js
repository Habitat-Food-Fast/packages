Package.describe({
  name: "habitat-promos",
  summary: "Promos collection",
  version: "1.0.6"
});

Package.onUse(function (api) {
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('mdg:validated-method');
  api.use('matteodem:easy-search');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('didericis:permissions-mixin', ['client', 'server']);
  api.addFiles('collection.instances.js', ['client', 'server']);
  api.addFiles('methods.instances.js', ['client', 'server']);
  api.addFiles('schema.instances.js', ['client', 'server']);
  api.addFiles('types.instances.js', ['client', 'server']);
  api.addFiles('util.instances.js', ['client', 'server']);
  api.export('Instances');
});
