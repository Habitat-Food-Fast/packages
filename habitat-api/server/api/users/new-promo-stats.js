// import convert from 'json-2-csv';
// Router.route('/users-new/', {
//   where: 'server',
//   action() {
//
//     users = Meteor.users.find({roles: {$nin: ['vendor']}}).map(u => {
//       txs = transactions.find({
//         buyerId: u._id, status: {$in: transactions.completedAndArchived()}}, {sort: {timeRequested: -1}});
//       return {
//         created: new Date(u.createdAt),
//         lastSeen: `${u.status.lastLogin ? u.status.lastLogin.date : 0}`,
//         lastOrderPlaced:  txs.fetch()[0] ? txs.fetch()[0].humanTimeRequested : '',
//         habitat: u.profile.habitat && Habitats.findOne(u.profile.habitat) ? Habitats.findOne(u.profile.habitat).name : '',
//         userId: u._id,
//         name: u.profile.fn || '',
//         email: u.profile.email || '',
//         phone: u.profile.phone,
//       };
//     });
//
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(users, 'totalCompleted').reverse()), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('users_all'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
