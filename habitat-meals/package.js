Package.describe({
  name: 'habitat-meals',
  version: '1.0.2',
  // Brief, one-line summary of the package.
  summary: 'Meal plans are a great idea',
  // URL to the Git repository containing the source code for this package.
  documentation: null
});

Npm.depends({
  "simpl-schema": "0.3.1"
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.3');
  api.use('ecmascript');
  api.use('underscore');
  api.use('aldeed:collection2-core');
  api.use('mongo', ['client', 'server']);
  api.use('tracker', 'server');
  api.mainModule('Meals.js');
  api.export('Meals');
  api.export('Invoices');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('habitat-meals');
});
