import convert from 'json-2-csv';
Router.route('/promos-all/', {
  where: 'server',
  action() {
    instances = Instances.find({}).map((i) => {
      instance = _.extend(i, {
        dateIssued: new Date(i.dateIssued),
        ownerCount: i.owners.length,
        redeemedCount: i.redeemedBy.length,
        channelType: i.channelType ? i.channelType : '',
        channel: i.channel ? i.channel : '',
        subchannel: i.subChannel && i.subChannel === null ? '' : i.subChannel || '',
      });
      delete instance.giveOwnerDiscountOnRedeem;
      delete instance.subChannel;
      delete instance.redeemedBy;
      delete instance.owners;

      return instance;
    });

    convert.json2csv(EJSON.toJSONValue(_.sortBy(instances, 'redeemedCount').reverse()), (err, spreadsheet) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        this.response.writeHead(200, csv.writeHead('promos_all', 'csv'));
        this.response.end(spreadsheet);
      }
    }, csv.settings);
  }
});

Router.route('/promos-customer-used/', {
  where: 'server',
  action() {
    instances = Instances.find({}).map((i) => {
      instance = _.extend(i, {
        dateIssued: new Date(i.dateIssued),
        ownerCount: i.owners.length,
        redeemedCount: i.redeemedBy.length,
        channelType: i.channelType ? i.channelType : '',
        channel: i.channel ? i.channel : '',
        subchannel: i.subChannel && i.subChannel === null ? '' : i.subChannel || '',
      });
      delete instance.giveOwnerDiscountOnRedeem;
      delete instance.subChannel;
      delete instance.redeemedBy;
      delete instance.owners;

      return instance;
    }).filter(i => i.channel === 'referrals' && i.subchannel === 'customer-promo' && i.ownerCount > 0 && i.redeemedCount > 0);

    convert.json2csv(EJSON.toJSONValue(_.sortBy(instances, 'redeemedCount').reverse()), (err, spreadsheet) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        this.response.writeHead(200, csv.writeHead('promos_all', 'csv'));
        this.response.end(spreadsheet);
      }
    }, csv.settings);
  }
});
