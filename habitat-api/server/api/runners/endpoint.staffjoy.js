// import convert from 'json-2-csv';
//
// Router.route('/staffjoy/org', {
//   where: 'server',
//   action() {
//     HTTP.call(`GET`, staffJoy._getUrl() , { auth: staffJoy._auth }, (err, res) => {
//       if(err) { throwError(err.message); } else {
//         jlog(res.data.data);
//         return convert.json2csv(res.data.data, (err, spreadsheet) => {
//           console.log('Finished converting');
//           if(err) { throw new Meteor.Error(err.message); } else {
//             console.log('Success, serving spreadsheet');
//             this.response.writeHead(200, csv.writeHead(`org`));
//             this.response.end(spreadsheet);
//           }
//         }, csv.settings);
//       }
//     });
//   }
// });
//
// Router.route('/staffjoy/loc', {
//   where: 'server',
//   action() {
//     Habitats.find().forEach((habitat) => {
//       Meteor.setTimeout(function(){
//         HTTP.call(`GET`, staffJoy._getUrl(`locations/${habitat.staffJoyId}`) , { auth: staffJoy._auth }, (err, res) => {
//           if(err) { console.warn(err.message); } else {
//             jlog(res.data.data);
//           }
//         });
//         });
//     });
//   }
// });
//
// Router.route('/staffjoy/location-migrate', {
//   where: 'server',
//   action() {
//     Habitats.find().forEach(h => {
//       Meteor.setTimeout(function(){
//         HTTP.call(`GET`, staffJoy._getUrl(`locations/${h.staffJoyId}`) , { auth: staffJoy._auth }, (err, res) => {
//           if(err) { console.warn(err.message); } else {
//             jlog(res);
//               HTTP.call(`POST`, 'http://staffing.tryhabitat.com/api/v2/organizations/1/locations', {
//                 auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6Nywia2V5IjoiMDY4MjExMWVhZWZkY2ZjYmY4MGU4MzczZjYwOTU5ODQ3MDQyNmE4MyJ9.CwAH2ueIb0ppOa3mLTIj1-gJBc1r5fP-gwH3xwPomzw:Mpasz1992",
//                 params: {
//                   name: res.data.data.name,
//                   timezone: 'America/New_York'
//                 },
//               }, (err, res) => {
//                 if(err) { console.warn(err.message); } else {
//                   jlog(res);
//                 }
//               });
//           }
//         });
//       });
//     });
//
//   }
// });
//
//
// Router.route('/staffjoy/org-admin', {
//   where: 'server',
//   action() {
//
//       HTTP.call(`POST`, 'http://staffing.tryhabitat.com/api/v2/organizations/1/admins', {
//         auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwia2V5IjoiZjUxOGFjODFhOTkzYmY2OWJiMjY0NTQ3NzczMWFlZWE4ZDc3ZGFkYiJ9.bXI9Wb9uHrlkEwBomOVvcU27MyNYdpH4IXj5rtddVAI:Mpasz1992",
//         params: {
//           email: 'mike@tryhabitat.com'
//         },
//       }, (err, res) => {
//         if(err) { console.warn(err.message); } else {
//           jlog(res.data.data);
//         }
//       });
//   }
// });
//
//
// Router.route('/staffjoy/shifts/tu', {
//   where: 'server',
//   action() {
//       url = 'http://staffing.tryhabitat.com/api/v2/organizations/1/locations/2/roles/3/shifts/';
//       HTTP.call(`GET`, staffJoy._getUrl(), {
//         auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwia2V5IjoiMmMwMzU2NTVlMDc5NjlkZmQxNDA4MWU4MjZmZTYxM2YyMmNmOTRiYSJ9.KNlsRJh5vl24-kJYsmcqPp6NLhZmwiY9N7rjcqbf7I0:Mpasz1992",
//         params: {
//             start: "2017-03-05T08:00:00",
//             end : "2017-03-28T08:00:00",
//         },
//       }, (err, res) => {
//         if(err) { console.warn(err.message); } else {
//           jlog(res.data.data);
//           res.data.data.forEach((shift) => {
//             Meteor.setTimeout(function(){
//               HTTP.call(`POST`, url, {
//                 auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwia2V5IjoiMmMwMzU2NTVlMDc5NjlkZmQxNDA4MWU4MjZmZTYxM2YyMmNmOTRiYSJ9.KNlsRJh5vl24-kJYsmcqPp6NLhZmwiY9N7rjcqbf7I0:Mpasz1992",
//                 params: {
//                   min_hours_per_workweek: 0,
//                   max_hours_per_workweek: 40,
//                   start: shift.start,
//                   stop: shift.stop,
//                   // internal_id: runner.internal_id,
//                 },
//               }, (err, res) => {
//                 if(err) { console.warn(err.message); } else {
//                   console.log(res.message);
//                 }
//               });
//             }, 1000);
//           });
//
//         }
//       });
//   }
// });
// Router.route('/staffjoy/shifts/uc', {
//   where: 'server',
//   action() {
//       HTTP.call(`GET`, 'https://suite.staffjoy.com/api/v2/organizations/183/locations/774/roles/1439/shifts/', {
//         auth: staffJoy._auth,
//         params: {
//             start: "2017-03-05T08:00:00",
//             end : "2017-03-28T08:00:00",
//         },
//       }, (err, res) => {
//         if(err) { console.warn(err.message); } else {
//           console.log('fetched staffjoy shift from base');
//           res.data.data.forEach((shift) => {
//             url = 'http://staffing.tryhabitat.com/api/v2/organizations/1/locations/3/roles/5/shifts';
//             params = {
//               auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwia2V5IjoiMmMwMzU2NTVlMDc5NjlkZmQxNDA4MWU4MjZmZTYxM2YyMmNmOTRiYSJ9.KNlsRJh5vl24-kJYsmcqPp6NLhZmwiY9N7rjcqbf7I0:Mpasz1992",
//               params: {
//                 start: shift.start,
//                 stop: shift.stop,
//                 user_id: shift.user_id,
//                 published: true,
//               },
//             }; console.log(`found userid for shift ${shift.user_id}`);
//             Meteor.setTimeout(function(){
//               HTTP.call(`POST`, url, params, (err, res) => {
//                 if(err) { console.warn(err.message); } else {
//                   console.log('shift.inserte');
//                 }
//               });
//             });
//           });
//
//         }
//       });
//   }
// });
//
// Router.route('/staffjoy/loc-admin', {
//   where: 'server',
//   action() {
//
//       HTTP.call(`POST`, 'http://staffing.tryhabitat.com/api/v2/organizations/1/locations/2/managers/', {
//         auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwia2V5IjoiZjUxOGFjODFhOTkzYmY2OWJiMjY0NTQ3NzczMWFlZWE4ZDc3ZGFkYiJ9.bXI9Wb9uHrlkEwBomOVvcU27MyNYdpH4IXj5rtddVAI:Mpasz1992",
//         params: {
//           email: 'mike@tryhabitat.com'
//         },
//       }, (err, res) => {
//         if(err) { console.warn(err.message); } else {
//           jlog(res);
//         }
//       });
//       HTTP.call(`POST`, 'http://staffing.tryhabitat.com/api/v2/organizations/1/locations/3/managers/', {
//         auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwia2V5IjoiZjUxOGFjODFhOTkzYmY2OWJiMjY0NTQ3NzczMWFlZWE4ZDc3ZGFkYiJ9.bXI9Wb9uHrlkEwBomOVvcU27MyNYdpH4IXj5rtddVAI:Mpasz1992",
//         params: {
//           email: 'mike@tryhabitat.com'
//         },
//       }, (err, res) => {
//         if(err) { console.warn(err.message); } else {
//           jlog(res);
//         }
//       });
//   }
// });
//
// Router.route('/staffjoy/workers/tu', {
//   where: 'server',
//   action() {
//     HTTP.call(`GET`, staffJoy._getUrl('workers') , { auth: staffJoy._auth }, (err, res) => {
//       if(err) { console.warn(err.message); } else {
//         console.log('first res.data.data is');
//         res.data.data.forEach((runner) => {
//           jlog(runner);
//           if(runner.location_id === 330){
//             //330
//             url = `http://staffing.tryhabitat.com/api/v2/organizations/1/locations/2/roles/3/users/`;
//             console.log(url);
//
//             Meteor.setTimeout(function(){
//               HTTP.call(`POST`, url, {
//                 auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwia2V5IjoiMmMwMzU2NTVlMDc5NjlkZmQxNDA4MWU4MjZmZTYxM2YyMmNmOTRiYSJ9.KNlsRJh5vl24-kJYsmcqPp6NLhZmwiY9N7rjcqbf7I0:Mpasz1992",
//                 params: {
//                   min_hours_per_workweek: 0,
//                   max_hours_per_workweek: 40,
//                   name: runner.name,
//                   email: runner.email,
//                   // internal_id: runner.internal_id,
//                 },
//               }, (err, res) => {
//                 if(err) { console.warn(err.message); } else {
//                   console.log(res.message);
//                 }
//               });
//             });
//           }
//           });
//
//
//
//         // return convert.json2csv(staffJoy.getWorkers(res.data.data), (err, spreadsheet) => {
//         //   console.log('Finished converting');
//         //   if(err) { throw new Meteor.Error(err.message); } else {
//         //     console.log('Success, serving spreadsheet');
//         //     this.response.writeHead(200, csv.writeHead(`org`));
//         //     this.response.end(spreadsheet);
//         //   }
//         // }, csv.settings);
//       }
//     });
//   }
// });
//
//
// Router.route('/staffjoy/workers/uc', {
//   where: 'server',
//   action() {
//     HTTP.call(`GET`, staffJoy._getUrl('workers') , { auth: staffJoy._auth }, (err, res) => {
//       if(err) { console.warn(err.message); } else {
//         console.log('first res.data.data is');
//         res.data.data.forEach((runner) => {
//           // jlog(runner);
//           if(runner.location_id === 774){
//             console.log('is UC');
//             //330
//             url = `http://staffing.tryhabitat.com/api/v2/organizations/1/locations/3/roles/5/users/`;
//             console.log(url);
//
//             Meteor.setTimeout(function(){
//               HTTP.call(`POST`, url, {
//                 auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwia2V5IjoiMmMwMzU2NTVlMDc5NjlkZmQxNDA4MWU4MjZmZTYxM2YyMmNmOTRiYSJ9.KNlsRJh5vl24-kJYsmcqPp6NLhZmwiY9N7rjcqbf7I0:Mpasz1992",
//                 params: {
//                   min_hours_per_workweek: 0,
//                   max_hours_per_workweek: 40,
//                   name: runner.name,
//                   email: runner.email,
//                   // internal_id: runner.internal_id,
//                 },
//               }, (err, res) => {
//                 if(err) { console.warn(err.message); } else {
//                   console.log(res);
//                 }
//               });
//             });
//           }
//           });
//
//
//
//         // return convert.json2csv(staffJoy.getWorkers(res.data.data), (err, spreadsheet) => {
//         //   console.log('Finished converting');
//         //   if(err) { throw new Meteor.Error(err.message); } else {
//         //     console.log('Success, serving spreadsheet');
//         //     this.response.writeHead(200, csv.writeHead(`org`));
//         //     this.response.end(spreadsheet);
//         //   }
//         // }, csv.settings);
//       }
//     });
//   }
// });
//
// Router.route('/staffjoy/keys', {
//   where: 'server',
//   action() {
//     HTTP.call(`GET`, 'http://staffing.tryhabitat.com/api/v2/users/1/apikeys', {
//       auth: "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6Nywia2V5IjoiMDY4MjExMWVhZWZkY2ZjYmY4MGU4MzczZjYwOTU5ODQ3MDQyNmE4MyJ9.CwAH2ueIb0ppOa3mLTIj1-gJBc1r5fP-gwH3xwPomzw:Mpasz1992",
//  }, (err, res) => {
//       console.log(res);
//   });
// }
//
// });
