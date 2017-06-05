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
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('ecmascript');
  api.addFiles('env.js');
  api.export('DDPenv');
});
