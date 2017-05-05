// import convert from 'json-2-csv';
// Router.route('/runners/', {
//   where: 'server',
//   action() {
//
//     users = Meteor.users.find( {roles: {$in: ['runner']}}).map(u => {
//       return {
//         _id: u._id,
//         name: u.profile.fn || '',
//         email: u.profile.email || '',
//         avgRating: calc._roundToTwo(u.profile.avgRating) || '',
//       };
//     });
//
//     const query = _.sortBy(users, 'name');
//
//     convert.json2csv(EJSON.toJSONValue(query), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('users_all'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
