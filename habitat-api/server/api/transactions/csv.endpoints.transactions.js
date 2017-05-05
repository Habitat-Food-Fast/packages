// import convert from 'json-2-csv';
//
// runWeekQuery = (req={ params: {}}) => {
//     req.csv = true;
//     req.week = parseInt(req.params.weekNum);
//     const wk = weeks.findOne({
//       week: Number(req.week ? req.week : weeks.find().count())
//     });
//
//     req.getAll = false;
//     req.getIncomplete = false;
//     req.collection = transactions;
//     req.bizId = req.params.bizId;
//     console.log('hit route');
//     txs = txQuery(wk, req);
//     query = EJSON.toJSONValue(txs.map((tx, index)=> {
//       console.log(`completed ${(index / txs.length) * 100}%`);
//
//       return _.extend(transactions.csv.orders(tx._id, req), { deliveryAddress: tx.deliveryAddress });
//     })); console.log(`query ${query.length}`);
//
//     return convert.json2csv(query,
//       Meteor.bindEnvironment((err, spreadsheet) => {
//         if(err) { throw new Meteor.Error(err.message); } else{
//           if(req.response){
//             console.log('sending email');
//             req.response.writeHead(200, csv.writeHead(`${wk.startTime}_to_${wk.endTime} generated`));
//             req.response.end(spreadsheet);
//             Email.send({
//               to: 'mike@tryhabitat.com',
//               from: 'app@market.tryhabitat.com',
//               subject: 'Daily Transaction Summary',
//               text: 'here it is',
//               attachments: [{
//                 fileName: `${wk.startTime}_to_${wk.endTime}.csv`,
//                 contents: spreadsheet,
//               }],
//             });
//           }
//         }
//       }), csv.settings
//     );
// };
//
// Router.route('/transactions/:weekNum', {
//   where: 'server',
//   action() { runWeekQuery(this); }
// });
//
// writeHead = (title, format) => {
//   clientDate = moment().utc().tz("America/New_York").format('"dddd, MMMM Do YYYY, h:mm:ss a"');
//   const fileFormat = format ? format : 'csv';
//   return { 'Content-Type': `text/${format}`, "Content-Disposition": `attachment;filename=${title}${clientDate}.${fileFormat}` };
// };
//
// Router.route('/bizTransactions/:weekNum/:bizId', {
//   where: 'server',
//   action() {
//     req.week = parseInt(req.params.weekNum);
//     const wk = weeks.findOne({week: Number(req.week ? req.week : weeks.find().count())});
//     req.bizId = req.params.bizId;
//
//     csv = transactions.csv.vendor.payout.DaaS(bizId, wk.week, true, token);
//   }
// });
//
// Router.route('/alltransactions/', {
//   where: 'server',
//   action() {
//     //PARAMS: week number. defaults to latest if none provided.
//     this.csv = true;
//     this._collection_name = transactions._name;
//     this.csvRequest = transactions.csv.orders;
//
//     //QUERIES:
//     this.getAll = true; //whether or not we want to filter, again defaults to latest
//     this.getIncomplete = false;
//     convert.json2csv(csv.mapDocs(transactions.find({}, {sort: {createdAt: 1}}), this), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('all_transactions'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//     }
// });
//
// Router.route('/allcompleted/', {
//   where: 'server',
//   action() {
//     //PARAMS: week number. defaults to latest if none provided.
//     this.csv = true;
//     this._collection_name = transactions._name;
//     this.csvRequest = transactions.csv.orders;
//
//     //QUERIES:
//     this.getAll = false; //whether or not we want to filter, again defaults to latest
//     this.getIncomplete = false;
//     convert.json2csv(csv.mapDocs(transactions.find({
//       buyerId: { $nin: Meteor.users.find({roles: {$in: ['admin']}}).map(u => u._id) },
//       status: { $in: transactions.completedAndArchived() },
//     }, { limit: 1000, sort: {timeRequested: -1}}), this), (err, spreadsheet) => {
//       if(err) { throw new Meteor.Error(err.message); } else {
//         console.log('serving doc');
//
//         this.response.writeHead(200, csv.writeHead('allcompleted'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//     }
// });
//
// Router.route('/alltransactionitems/', {
//   where: 'server',
//   action() {
//     const query = transactions.find({
//       status: {$in: transactions.completedAndArchived()}
//     }, {sort: {createdAt: 1}, limit: 1000});
//     const mappedItems = EJSON.toJSONValue(
//       query.map((doc) => {
//         // readPercent(query.count());
//         itemJson = transactions.csv.items(doc._id);
//         return itemJson;
//     }));
//
//     jsonArray = [];
//     mappedItems.filter(item => item && !item.includes()).forEach((arrayWithSingleOrder) => {
//       if(arrayWithSingleOrder) {
//         arrayWithSingleOrder.forEach(o => jsonArray.push(arrayWithSingleOrder[0]));
//       }
//     });
//     jlog('log', mappedItems);
//     convert.json2csv(jsonArray, (err, spreadsheet) => {
//       console.log(err);
//       if(err) { throw new Meteor.Error(err.message); } else {
//         this.response.writeHead(200, csv.writeHead('all_transactions'));
//         this.response.end(spreadsheet);
//       }
//     }, csv.settings);
//     }
// });
//
// function readPercent(count) {
//   count = count + 1;
//   percentComplete = calc._roundToTwo(count/queryTotal) * 100;
//   if(percentComplete % 5 === 0){ console.log(`${percentComplete}% complete`); }
// }
//
// testPost = () => {
//   HTTP.post('http://dispatch.tryhabitat.com/api/v1/orders', {
//     data: {
//       api_key: '4069c24f2235104d07e41ac9d47a10a9',
//       isDelivery: true,
//       deliveryAddress: '2198 N Broad St', //optional if pickup
//       deliveryInstructions: 'Deliver via paper airplane', //optional if pickup
//       suite: 'apt 1b', //optional if pickup
//       customer: {
//         customerName: 'Mark',
//         customerPhone: '4113332222',
//         customerEmail: 'mark@tryhabitat.com'
//       },
//       sellerId: 'aq3b7s6THRGmPXjjD',
//       orderType: 'credit_card', //credit_card, prepaid, or cash
//       placedAt: '2017-03-27T21:40:31.153Z',
//       expectedAt: '2017-03-29T18:41:17.699Z',
//       order: [
//         {
//           itemName: 'Pepperoni',
//           itemCategory: 'Pizza',
//           itemPrice: 12.99,
//           modifiers: [
//             {
//               name: 'musterd',
//               category: 'on the side',
//               price: 12
//             },
//             {
//               name: 'extra musterd gizzards',
//               category: 'on top',
//               price: 0
//             }
//           ]
//         }
//       ],
//       payRef: {
//         total: 20,
//         tax: 1.34,
//         tip: 1.88,
//       },
//     }
//   }, ( error, response ) => {
//     if ( error ) {
//       console.log( error );
//     } else {
//       console.log( response );
//     }
//   });
// };
