Package.describe({
  name: 'habitat-braintree',
  version: '1.0.0',
  summary: 'Braintree code',
  documentation: null
});

Npm.depends({
  "braintree": "1.32.0",
});
Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use('ecmascript');
  api.use('check');
  api.mainModule('braintree.js');
  api.export('BT');
});
