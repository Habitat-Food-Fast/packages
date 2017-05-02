import convert from 'json-2-csv';

Router.route('/mealrecords/:userId', {
  where: 'server',
  action() {
      convert.json2csv(MealRecords.find({uid: this.params.userId}, {sort: {stamp: 1}}).fetch(), (err, spreadsheet) => {
        console.log('Finished converting');
        if(err) { throw new Meteor.Error(err.message); } else {
          console.log('Success, serving spreadsheet');
          this.response.writeHead(200, csv.writeHead(`week_${this.week}_deliveries`));
          this.response.end(spreadsheet);
        }
      }, csv.settings);
  }
});
