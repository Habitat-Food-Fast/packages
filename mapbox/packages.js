Package.describe({
  name:     'mapbox',
  summary:  'Mapbox.js for Meteor apps',
  version:  '3.0.0',
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.2.3');
  api.use(['deps', 'underscore'], ['client']);

  api.addFiles(['mapbox.js', 'mapbox.css'], ['client']);

  api.export('Mapbox', ['client']);
});
