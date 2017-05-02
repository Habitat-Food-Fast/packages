import convert from 'json-2-csv';

Router.route('/staffjoy/shifts/:habitatId/:weekNum', {
  where: 'server',
  action() {
    const week = weeks.findOne({week: parseInt(this.params.weekNum)});
    const habitat = Habitats.findOne(this.params.habitatId);
    HTTP.call(`GET`, staffJoy._getUrl(`locations/${habitat.staffJoyId}/roles/${habitat.staffJoyRunnerRole}/shifts`), {
        auth: staffJoy._auth,
        params: { start: moment(week.startTime).toISOString(), end: moment(week.endTime).toISOString(), include_summary: true, }
      }, (err, res) => {
      if(err) { throwError(err.message); } else {
        const workersWithTotals = staffJoy.getWorkers(res.data.data).map((w) => {
          const runnerTxs = transactions.find({
            method: 'Delivery',
            status: { $in: [3,4] },
            runnerId: Meteor.users.findOne({username: w.email})._id,
          }).fetch().filter((t) => {
            return t.timeRequested > new Date(week.startTime).getTime() &&
                   t.timeRequested < new Date(week.endTime).getTime();
          });
          return _.extend(w, {
            orders: runnerTxs.length,
            // habitatMakes = totalPrice + vendorCommision + 50% of deliveryFee
            // runnerPayout = tips + (hours * 4) + (50% delivery fee * # of transactions)
            tipOwed: runnerTxs.map(t => t.payRef.tip || 0).reduce((sum, num) => { return sum + num; }, 0)
          });
        });

        return convert.json2csv(workersWithTotals, (err, spreadsheet) => {
          console.log('Finished converting');
          if(err) { throw new Meteor.Error(err.message); } else {
            console.log('Success, serving spreadsheet');
            this.response.writeHead(200, csv.writeHead(`org`));
            this.response.end(spreadsheet);
          }
        }, csv.settings);
      }
    });
  }
});
