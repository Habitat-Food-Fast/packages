// import convert from 'json-2-csv';
//
// Router.route('/staffjoy/active-shifts/', {
//   where: 'server',
//   action() {
//     const params = {
//       start: Habitats.openedAtToday(Habitats.findOne()._id),
//       end: Habitats.closedAtToday(Habitats.findOne()._id),
//       include_summary: true,
//     }; jlog(params);
//     HTTP.call(`GET`, staffJoy._getUrl(`locations/${staffJoy._temple}/roles/626/shifts`), {
//         auth: staffJoy._auth,
//         params: params
//       }, (err, res) => {
//       if(err) { throwError(err.message); } else {
//
//         const workersWithTotals = staffJoy.getWorkers(res.data.data).map((w) => {
//           console.log(`found worker ${w.id}`);
//         });
//         console.log(`workerswtots ${workersWithTotals.length}`);
//       }
//     });
//   }
// });
