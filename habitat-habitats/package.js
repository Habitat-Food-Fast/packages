Package.describe({
  name: "habitat-habitats",
  summary: "Habitats collection stuff",
  version: "1.0.6"
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('check');
  api.use('aldeed:collection2-core');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('lepozepo:accounting');
  api.use('habitat-calc');
  api.use('matb33:collection-hooks');
  api.addFiles('collection.habitats.js', ['client', 'server']);
  api.addFiles('methods.habitats.js', ['client', 'server']);
  api.addFiles('schema.habitats.js', ['client', 'server']);
  api.export('Habitats');
  api.export('insertFairmount');
  api.export('zones');
});
