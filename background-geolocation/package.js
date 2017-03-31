Package.describe({
  name: 'background-geolocation',
  version: '1.2.3',
  summary: 'Swift test of background geolocation',
});

Cordova.depends({
  "cordova-plugin-geolocation" : "2.1.0",
  // "org.flybuy.cordova.background-location-services" : "https://github.com/pmwisdom/cordova-background-geolocation-services.git#9e499cf0e60a9ea77383781ad3b083fa1c1592ae"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.addFiles('background-geolocation.js');
  // api.export('BackgroundLocation');
  api.use('ecmascript');
});
