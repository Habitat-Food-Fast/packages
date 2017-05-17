import convert from 'json-2-csv';
// Router.route('/businessprofiles/:weekNum', {
//   where: 'server',
//   action() {
//     this.collection = businessProfiles;
//     this.week = parseInt(this.params.weekNum);
//     const wk = weeks.findOne({week: Number(this.week ? this.week : weeks.find().count())});
//     console.log(`week is ${wk.week}`);
//     const query = businessProfiles.find().map((biz) => {
//     const vendorWeek = calc.weeks.getWeek(biz._id, this.week);
//     console.log(`vendor comp count is ${vendorWeek.transactions.length} for ${ businessProfiles.findOne(biz._id).company_name}`);
//     return {
//         start: csv.transformTime(vendorWeek.startTime, true),
//         end: csv.transformTime(vendorWeek.startTime, true),
//         vendor: businessProfiles.findOne(biz._id).company_name,
//         completed: vendorWeek.completedTransactions.length,
//         'Cancelled / Declined': vendorWeek.potentialTransactions.length,
//         'Missed Revenue': calc._roundToTwo(vendorWeek.potentialTransactions.reduce((total, tx) => { return total + tx.vendorPayRef.totalPrice; }, 0)),
//         'Order Revenue': calc._roundToTwo(vendorWeek.subtotal.orders),
//         'DaaS Revenue': calc._roundToTwo(vendorWeek.subtotal.DaaS),
//         'Order Payout': calc._roundToTwo(vendorWeek.payout.orders),
//         'Order Payout': calc._roundToTwo(vendorWeek.payout.DaaS),
//       };
//     });
//     // .filter(t => t.completed.length > 0 );
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(query, 'completed').reverse()), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('week'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });

// Router.route('/businessprofiles/totals/:bizId', {
//   where: 'server',
//   action() {
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(calc.weeks._getAllWeeks(this.params.bizId), 'start')), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('week'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
//
//
// Router.route('/vendors/all', {
//   where: 'server',
//   action() {
//     const query = businessProfiles.find().map(b => ({ _id: b._id, company_name: businessProfiles.escape(b.company_name), company_address: b.company_address.replace(/,/g , " ")}));
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(query, 'company_name')), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('vendors_all'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
// import convert from 'json-2-csv';
// Router.route('/businessprofiles/:weekNum', {
//   where: 'server',
//   action() {
//     this.collection = businessProfiles;
//     this.week = parseInt(this.params.weekNum);
//     const wk = weeks.findOne({week: Number(this.week ? this.week : weeks.find().count())});
//     console.log(`week is ${wk.week}`);
//     const query = businessProfiles.find().map((biz) => {
//     const vendorWeek = calc.weeks.getWeek(biz._id, this.week);
//     console.log(`vendor comp count is ${vendorWeek.transactions.length} for ${ businessProfiles.findOne(biz._id).company_name}`);
//     return {
//         start: csv.transformTime(vendorWeek.startTime, true),
//         end: csv.transformTime(vendorWeek.startTime, true),
//         vendor: businessProfiles.findOne(biz._id).company_name,
//         completed: vendorWeek.completedTransactions.length,
//         'Cancelled / Declined': vendorWeek.potentialTransactions.length,
//         'Missed Revenue': calc._roundToTwo(vendorWeek.potentialTransactions.reduce((total, tx) => { return total + tx.vendorPayRef.totalPrice; }, 0)),
//         'Order Revenue': calc._roundToTwo(vendorWeek.subtotal.orders),
//         'DaaS Revenue': calc._roundToTwo(vendorWeek.subtotal.DaaS),
//         'Order Payout': calc._roundToTwo(vendorWeek.payout.orders),
//         'Order Payout': calc._roundToTwo(vendorWeek.payout.DaaS),
//       };
//     })
//     // .filter(t => t.completed.length > 0 );
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(query, 'completed').reverse()), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('week'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
//
// Router.route('/businessprofiles/totals/:bizId', {
//   where: 'server',
//   action() {
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(calc.weeks._getAllWeeks(this.params.bizId), 'start')), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('week'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
//
//
// Router.route('/vendors/all', {
//   where: 'server',
//   action() {
//     const query = businessProfiles.find().map(b => ({ _id: b._id, company_name: businessProfiles.escape(b.company_name), company_address: b.company_address.replace(/,/g , " ")}));
//     convert.json2csv(EJSON.toJSONValue(_.sortBy(query, 'company_name')), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('vendors_all'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//   }
// });
//
// businessProfiles.escape = company_name => company_name.replace(/,/g , " ").replace('&', ' and ');
