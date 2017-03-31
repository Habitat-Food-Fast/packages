Package.describe({
  name: 'combined-location',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use([
      'ecmascript',
      'mirrorcell:geolocation-plus@1.1.8',
      'background-geolocation',
      'app-state',
      'reactive-var'
  ], 'client');

  api.imply(['mirrorcell:geolocation-plus', 'background-geolocation'], ['client']);

  api.addFiles(['lib/combined-location.js'], 'client');

  api.export('CombinedLocation', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('combined-location');
  api.addFiles('combined-location-tests.js');
});
