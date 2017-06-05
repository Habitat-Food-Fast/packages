Package.describe({
  name: "habitat-vendors",
  summary: "Businessprofiles collection stuff",
  version: "1.0.6"
});

Package.onUse(function (api) {
  api.use('underscore');
  api.use('ecmascript');
  api.use('mongo');
  api.use('random');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');
  api.use('momentjs:moment');
  api.use('mdg:validated-method');
  api.use('alanning:roles');
  api.use('didericis:permissions-mixin');
  api.addFiles('collection.businessProfiles.js', ['client', 'server']);
  api.addFiles('methods.businessProfiles.js', ['client', 'server']);
  api.addFiles('schema.businessProfiles.js', ['client', 'server']);
  api.export('businessProfiles');
});
