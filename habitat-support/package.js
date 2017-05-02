Package.describe({
  name: 'habitat-support',
  version: '1.1.3',
  // Brief, one-line summary of the package.
  summary: 'Support and messaging',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
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
  api.addFiles('collection.support.js', ['client', 'server']);
  api.addFiles('methods.support.js', ['client', 'server']);
  api.addFiles('schema.support.js', ['client', 'server']);
  api.export('SupportTickets');
  api.export('Messages');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('habitat-support');
  api.mainModule('habitat-support-tests.js');
});
