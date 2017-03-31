Package.describe({
  name: 'habitat-categories',
  version: '1.0.2',
  // Brief, one-line summary of the package.
  summary: 'Categories',
  // URL to the Git repository containing the source code for this package.
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.3');
  api.use('ecmascript');
  api.use('aldeed:collection2');
  api.use(["aldeed:simple-schema@1.5.3", "underscore"]);
  api.use('mongo', ['client', 'server']);
  api.use('tracker', 'server');
  api.addFiles('collection.categories.js');
  api.addFiles('methods.categories.js');
  api.addFiles('schema.categories.js');
  api.export('Categories');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('habitat-meals');
});
