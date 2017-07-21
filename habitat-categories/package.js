Package.describe({
  name: 'habitat-categories',
  version: '1.0.2',
  // Brief, one-line summary of the package.
  summary: 'Categories',
  // URL to the Git repository containing the source code for this package.
  documentation: null
});

Npm.depends({
  "simpl-schema": "0.3.1"
});


Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('ecmascript');
  api.use('aldeed:collection2-core');

  api.use("underscore");
  api.use('mongo', ['client', 'server']);
  api.use('tracker', 'server');
  api.addFiles('collection.categories.js');
  api.addFiles('schema.categories.js');
  api.export('Categories');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('habitat-meals');
});
