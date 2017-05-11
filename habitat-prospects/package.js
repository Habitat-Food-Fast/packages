Package.describe({
  name: 'habitat-prospects',
  version: '1.0.0',
  summary: 'Prospects collection stuff',
});

Package.onUse(function(api) {
  api.use('ecmascript');
  api.use(["aldeed:simple-schema", "aldeed:collection2", "underscore"]);
  api.use('mongo', ['client', 'server']);
  api.use('mdg:validated-method', ['client', 'server']);
  api.use('didericis:permissions-mixin');
  api.addFiles('collection.prospects.js', ['client', 'server']);
  api.addFiles('methods.prospects.js', ['client', 'server']);
  api.addFiles('schema.prospects.js', ['client', 'server']);
  api.export('Prospects');
});
