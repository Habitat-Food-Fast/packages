Package.describe({
  name: 'habitat-calc',
  version: '1.2.0',
  // Brief, one-line summary of the package.
  summary: 'Hands-free, reactive payment calculations',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/mikepaszkiewicz/habitat-calc',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use('ecmascript');
  api.use('check');
  api.mainModule('habitat-calc.js');
  api.export('calc');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('habitat-calc');
  api.mainModule('habitat-calc-tests.js');
});
