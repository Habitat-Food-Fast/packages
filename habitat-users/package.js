Package.describe({
  name: 'habitat-users',
  version: '1.0.0',
  summary: 'Support and messaging',
  git: '',
  documentation: null
});
Npm.depends({
  "simpl-schema": "0.3.1"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('ecmascript');
  api.use('http');
  api.use('url');
  api.use('aldeed:collection2-core');
  api.use('mongo', ['client', 'server']);
  api.use('mdg:validated-method', ['client', 'server']);
  api.addFiles('users.js');
  api.export('Meteor');
});
