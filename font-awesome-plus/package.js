Package.describe({
  name: "font-awesome-plus",
  summary: "Latest version Font-Awesome loaded via CDN",
  version: "0.0.1"
});

Package.onUse(function (api){
  api.versionsFrom("METEOR@1.2.1");
  api.addFiles('load.js', 'client');
});
