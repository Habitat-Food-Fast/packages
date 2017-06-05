Package.describe({
  name: 'habitat-master',
  version: '1.2.0',
  summary: 'Master transaction code',
  git: 'https://github.com/mikepaszkiewicz/habitat-weeks',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('ecmascript');
  api.use('check');
  api.use('random');
  api.use('aldeed:collection2');
  api.use(["aldeed:simple-schema@1.5.3", "underscore"]);
  api.use('mongo', ['client', 'server']);
  api.addFiles('collection.master.js');
  api.export('masterTransactions');
});
