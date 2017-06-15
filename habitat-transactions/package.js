Package.describe({
  name: "habitat-transactions",
  summary: "Transactions collection stuff",
  version: "1.0.6"
});
Npm.depends({
  "phaxio": "0.0.6",
  "geolib": "2.0.22",
  "json-2-csv": "2.1.1"
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.4.2');

  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('matteodem:easy-search');
  api.use('check');
  api.use('http@1.2.10');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('lepozepo:accounting');
  api.use('habitat-calc');
  api.addFiles('collection.transactions.js', ['client', 'server']);
  api.addFiles('methods.transactions.js', ['client', 'server']);
  api.addFiles('resolvers.transactions.js', ['client', 'server']);
  api.addFiles('util.transactions.js', ['client', 'server']);

  api.export('handleInitialVendorContact');
  api.export('gmapsUrl');
  api.export('transactions');
  api.export('validateOrder');
});
