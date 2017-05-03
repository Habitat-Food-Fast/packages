Router.route('/transactions/week/:weekNum', {
  where: 'server',
  action() {
    this.csv = false;
      this.week = parseInt(this.params.weekNum);
      const wk = weeks.findOne({week: Number(this.week ? this.week : weeks.find().count())});

      const totalCount = txQuery(wk, _.extend(this, {getAll: true})).count();
      const completeCount = txQuery(wk, _.extend(this, {getAll: false, getIncomplete: false})).count();
      console.log(`completeCount is ${completeCount}`);
      console.log(`totalCount is ${totalCount}`);

      this.response.writeHead('Content-Type', 'application/json');
      this.response.end({ completeCount, totalCount });

  }
});

Router.route('/transactions/day/:start/:end/count', {
  where: 'server',
  action() {
    this.csv = false;
      this.week = parseInt(this.params.weekNum);
      const wk = weeks.findOne({week: Number(this.week ? this.week : weeks.find().count())});

      const totalCount = txQuery(wk, _.extend(this, {getAll: true})).count();
      const completeCount = txQuery(wk, _.extend(this, {getAll: false, getIncomplete: false})).count();
      console.log(`completeCount is ${completeCount}`);
      console.log(`totalCount is ${totalCount}`);

      this.response.writeHead('Content-Type', 'application/json');
      this.response.end({ completeCount, totalCount });

  }
});

getTxs = () => {
  startOfDay = moment.utc().subtract(5, 'hours').startOf('day');
  console.log('start of day was ' + startOfDay);
  latestTimeReq = transactions.findOne({}, {sort: {timeRequested: -1}}).timeRequested;
  console.log('latest time requested was ' + latestTimeReq);

  if(latestTimeReq > startOfDay) {
    console.log('time requested is greater than start of day');
  } else {
    console.warn('time requested is not greater than start of day');
  }
  todayTransactions =transactions.find({timeRequested: {$gt: startOfDay}});
  console.log(`${todayTransactions.count()} found for today`);
  return todayTransactions.count();
};

Meteor.methods({
  "getToday": function (argument) {
    return getTxs();
  }
});
