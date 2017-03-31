Package.describe({
  name: 'habitat-environment',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: 'Environment checker for habitat.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/jpmoyn/habitat-environment',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use('ecmascript');
  api.addFiles('env.js');
  api.export('DDPenv');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
});
