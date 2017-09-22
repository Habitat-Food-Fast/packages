Package.describe({
  name: 'settings-check',
  version: '1.2.0',
  summary: 'Checks settings file for necessary settings',
  git: 'https://github.com/mikepaszkiewicz/habitat-weeks',
  documentation: null
});


Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.4.2');
  api.use('ecmascript');
  api.use('check');
  api.use('underscore');
  api.addFiles('check.js');
  api.export('round');
});
