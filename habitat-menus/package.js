Package.describe({
  name: 'habitat-menus',
  version: '1.0.0',
  summary: 'Support and messaging',
  git: '',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.3');
  api.use('ecmascript');
  api.use('http');
  api.use('url');
  api.use(["aldeed:simple-schema", "aldeed:collection2", "underscore"]);
  api.use('mongo', ['client', 'server']);
  api.use('mdg:validated-method', ['client', 'server']);

  api.addFiles('modifiers/collection.modifiers.js');
  api.addFiles('modifiers/methods.modifiers.js');
  api.addFiles('modifiers/schema.modifiers.js');
  api.addFiles('saleitems/collection.saleitems.js');
  api.addFiles('saleitems/schema.saleitems.js');

  api.export('saleItems');
  api.export('Modifiers');
  api.export('modCategories');
});
