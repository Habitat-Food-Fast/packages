Package.describe({
  name: 'habitat-weeks',
  version: '1.2.0',
  summary: 'Weeks code',
  git: 'https://github.com/mikepaszkiewicz/habitat-weeks',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use('ecmascript');
  api.use('check');
  api.use('random');
  api.use('aldeed:collection2');
  api.use(["aldeed:simple-schema@1.5.3", "underscore"]);
  api.use('mongo', ['client', 'server']);
  api.addFiles('collection.weeks.js');
  api.addFiles('startup.weeks.js');
  api.addFiles('schema.weeks.js');
  api.export('weeks');
});
