Package.describe({
  name: 'habitat-featured',
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
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('ecmascript');
  api.use('aldeed:collection2-core');
  api.use('underscore');
  api.use('mongo', ['client', 'server']);
  api.use('matteodem:easy-search@=1.6.4');
  api.use('mdg:validated-method');
  api.use('alanning:roles');
  api.use('didericis:permissions-mixin', ['client', 'server']);
  api.use('mdg:validated-method', ['client', 'server']);
  api.use('tracker', 'server');
  api.addFiles('collection.featured_meals.js');
  api.addFiles('methods.featured_meals.js');
  api.addFiles('schema.featured_meals.js');
  api.export('FeaturedMeals');
});
