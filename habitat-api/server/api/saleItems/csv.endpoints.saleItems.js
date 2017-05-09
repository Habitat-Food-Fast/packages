// import convert from 'json-2-csv';
//
// Router.route('/saleitems/:bizId', {
//   where: 'server',
//   action() {
//       this.collection = saleItems;
//       const query = saleItems.find({uid: this.params.bizId}, {sort: {category: 1}});
//       convert.json2csv(csv.mapDocs(query, this), (err, spreadsheet) => {
//         console.log('Finished converting');
//         if(err) { throw new Meteor.Error(err.message); } else {
//           console.log('Success, serving spreadsheet');
//           this.response.writeHead(200, csv.writeHead(`menu_${this.params.bizId}`));
//           this.response.end(spreadsheet);
//         }
//       }, csv.settings);
//   }
// });
