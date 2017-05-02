Package.describe({
  name: "habitat-api",
  summary: "Transactions collection stuff",
  version: "1.0.6"
});

Package.onUse(function (api) {
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('matteodem:easy-search');
  api.use('check');
  api.use('random');
  api.use('http@1.2.10');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('lepozepo:accounting');
  api.use('habitat-calc');
  api.use('themeteorchef:jquery-validation');
  api.use('meteorhacks:ssr');
  api.use('iron:router');
  api.use('accounts-base');
  api.use('accounts-password');
  api.addFiles([
    'server/api/_config.js',
    'server/api/orders/endpoint.js',
    'server/api/support/endpoint.js',
    'server/api/businessprofiles/csv.endpoint.businessprofiles.js',
    'server/api/instances/csv.endpoint.instances.js',
    'server/api/invoices/csv.invoices.js',
    'server/api/mealRecords/csv.mealrecords.js',
    'server/api/runners/active-shifts.js',
    'server/api/runners/endpoint.staffjoy.js',
    'server/api/runners/week-shifts.js',
    'server/api/runners/week-totals.js',
    'server/api/saleItems/csv.endpoints.saleItems.js',
    'server/api/saleItems/json.resolver.saleitems.js',
    'server/api/transactions/csv.endpoints.transactions.js',
    'server/api/transactions/csv.query.transactions.js',
    'server/api/transactions/json.endpoints.transactions.js',
    'server/api/users/new-promo-stats.js',
    'server/api/users/runner-stats.js',
    'server/api/methods.js',
    'server/_test-data.js',
    'server/emails.reset.js',
    'server/pubs.api-key.js',
    'server/startup.js',
  ], ['server']);

  api.addFiles(['examples.api.js', 'collection.api.js'], ['client', 'server']);
  api.export('API');
  api.export('APIKeys');
  api.export('Router');
});
