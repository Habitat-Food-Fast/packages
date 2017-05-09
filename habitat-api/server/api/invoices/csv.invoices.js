// import convert from 'json-2-csv';
//
// Router.route('/invoices/all', {
//   where: 'server',
//   action() {
//     const query = Invoices.find({}, {sort: {timeStamp: 1}}).map((i) => {
//       return {
//         _id: i._id,
//         type: i.type,
//         from: i.purchasedFrom,
//         userid: i.uid,
//         name: Meteor.users.findOne(i.uid) ? Meteor.users.findOne(i.uid).profile.fn : '',
//         braintreeId: i.braintreeTxId,
//         total: i.total,
//         meals: i.meals ? i.meals.length : 'NONE',
//         mealsArray: i.mealArray ? i.mealArray.length : 'NONE',
//         freeMeals: i.freeMealCount,
//         freeDels: i.freeDeliveries
//       };
//     });
//     convert.json2csv(_.sortBy(query, 'total').reverse(), (err, spreadsheet) => {
//       console.log('Finished converting');
//       if(err) { throw new Meteor.Error(err.message); } else {
//         console.log('Success, serving spreadsheet');
//         this.response.writeHead(200, csv.writeHead(`all_invoices`));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
