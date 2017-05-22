class habitatsCollection extends Mongo.Collection {
  setHours () {
    hoursArray = [];
    [0,1,2,3,4,5,6].forEach((i) => {
      var openHour = 11 * 3600000;
      var closeHour = 22 * 3600000;
      var dayBase = i * 86400000;
      hoursArray.push({
        day: i,
        open: true,
        openHr: '11:00 AM',
        closeHr: '10:00 PM',
        openTime: dayBase + openHour,
        closeTime: dayBase + closeHour,
      });
    });
    return hoursArray;
  }
  getDay (hab, time)  {
    check(hab, Object);
    check(time, Number);
    return _.findWhere(hab.weeklyHours, {day: findCurrentDay(time)});
  }
  getToday (habId) {
    const weeklyHours = Habitats.findOne(habId).weeklyHours; check(weeklyHours, [Object]);
    return _.findWhere( weeklyHours, { day: moment().day() } );
  }


  openedAtToday (habId)  {
      openHr = this.parseTo24Hour(this.getToday(habId).openHr);
      hr = moment((openHr), ["h:mm"]).format("HH");
      min = moment(openHr, ["h:mm"]).format("mm");
      return moment().day(moment(Date.now())  .subtract(
                    Meteor.settings.devMode ? 0 :
                    5, 'hours').day()).hour(hr).minute(min).format();
  }
  closedAtToday (habId)  {
      closeHr = this.parseTo24Hour(this.getToday(habId).closeHr);
      hr = moment((closeHr), ["h:mm"]).format("HH");
      min = moment(closeHr, ["h:mm"]).format("mm");
      return moment().day(moment(Date.now())  .subtract(
                    Meteor.settings.devMode ? 0 :
                    5, 'hours').day()).hour(hr).minute(min).format();
  }
  parseTo24Hour(hr) {
    return moment(hr, 'h:mm a').format('H:mm').split(':')[0];
  }
  schema () {
    return new SimpleSchema({
      _id: { type: String },
      name: { type: String },
      icon: { type: String },
      order: { type: Number, decimal: false },
      featured: { type: Boolean },
      open: { type: Boolean },
      mealsEnabled: { type: Boolean },
      surge: { type: Boolean },
      orderType: { type: String, allowedValues: ['pickup', 'delivery', 'either'] },
      deliveryTime: {
        type: Number,
        defaultValue: 20
      },
      weeklyHours: {
        type: [Object],
      },
      'weeklyHours.$.day': {
        type: Number,
        allowedValues: [0,1,2,3,4,5,6]
      },
      'weeklyHours.$.open': {
        type: Boolean
      },
      'weeklyHours.$.openHr': {
        type: String,
        trim: true
      },
      'weeklyHours.$.closeHr': {
        type: String,
        trim: true
      },
      'weeklyHours.$.openTime': {
        type: Number
      },
      'weeklyHours.$.closeTime': {
        type: Number
      },

    });
  }
  boundSchema (){
    return {
      bounds: {
        type: Object
      },
      'bounds.type': {
        type: 'String',
      },
      'bounds.data': {
        type: Object
      },
      'bounds.data.type': {
        type: String,
      },
      'bounds.data.properties': {
        type: Object
      },
      'bounds.data.properties.name': {
        type: String
      },
      'bounds.data.geometry': {
        type: Object
      },
      'bounds.data.geometry.coordinates': {
        type: [],
        blackbox: true
      },
    };
  }
}
// Habitats.attachSchema(Habitats.schema); breaks app, method is very secure now though

Habitats = new habitatsCollection('habitats');
Habitats.before.insert(function(userId, doc) {
  var habitatsCount = Habitats.find().count();
  doc.order = habitatsCount;
});

if (Meteor.isServer) {
  Habitats._ensureIndex({ 'bounds.data.geometry': '2dsphere'});  
}
