Package.describe({
  name: 'habitat-weeks',
  version: '1.2.0',
  summary: 'Weeks code',
  git: 'https://github.com/mikepaszkiewicz/habitat-weeks',
  documentation: null
});

Npm.depends({
  "simpl-schema": "0.3.0"
});


Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('ecmascript');
  api.use('check');
  api.use('random');
  api.use('aldeed:collection2-core');
  api.use('underscore');
  api.use('mongo', ['client', 'server']);
  api.addFiles('collection.weeks.js');
  api.addFiles('startup.weeks.js');
  api.addFiles('schema.weeks.js');
  api.export('weeks');
});
