_options = { fetchLocationOnStart : false };
//
// BackgroundLocation = {
//     tag : 'BackgroundLocation',
//     plugin : null,
//     started : false,
//     hasLocationCallback : false,
//     options : _options,
//     config : {
//         desiredAccuracy: 5,
//         distanceFilter: 1,
//         debug: true,
//         interval: 9000,
//         //Android Only
//         notificationTitle: 'BG Plugin',
//         notificationText: 'Tracking',
//         fastestInterval: 5000,
//         useActivityDetection: true
//     },
//     getPlugin() {
//         this.plugin = window.plugins.backgroundLocationServices;
//     },
//     havePlugin () {
//         if(!this.plugin) {
//             throw new Meteor.Error(this.tag, 'Could not find the background location plugin, please run BackgroundLocation.getPlugin');
//             return false;
//         }
//         return true;
//     },
//     configure(config) {
//         if(!this.havePlugin()) return;
//
//         if(_.isObject(config)) {
//             this.config = config;
//             this.plugin.configure(this.config);
//         } else {
//             throw new Meteor.Error(this.tag, 'Config parameter must be a object');
//         }
//     },
//     registerForLocationUpdates(success, failure){
//         if(!this.havePlugin()) return;
//
//         this.hasLocationCallback = true;
//         this.plugin.registerForLocationUpdates(success, failure);
//     },
//     registerForActivityUpdates(success, failure){
//         if(!this.havePlugin()) return;
//
//         this.plugin.registerForActivityUpdates(success, failure);
//     },
//     start() {
//         if(!this.havePlugin()) return;
//
//         if(!this.hasLocationCallback) {
//             throw new Meteor.Error(this.tag, 'You must register for location updates before starting background location updates');
//         }
//
//         this.plugin.start();
//
//     },
//     stop() {
//         if(!this.havePlugin()) return;
//
//         this.plugin.stop();
//     }
// };
// if(Meteor.isCordova) {
//     Meteor.startup(function () {
//         debug = BackgroundLocation.config.debug;
//         BackgroundLocation.getPlugin();
//         if(debug) console.log('got plugin, fetch on start is' + BackgroundLocation.options.fetchLocationOnStart);
//     });
// }
