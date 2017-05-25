businessProfiles.methods = {
  onboard: new ValidatedMethod({
    name: 'businessProfiles.methods.onboardSubmerchant',
    validate: new SimpleSchema({
      merchAcct: { type: Object, blackbox: true },
      sid: {type: String}
    }).validator(),
    run({ merchAcct, sid }) {
      if (!this.isSimulation && Roles.userIsInRole(this.userId, ['vendor']) ||
          !this.isSimulation && Roles.userIsInRole(this.userId, ['admin']) ) {
        BT.submerchant.create(merchAcct, sid, (err, success) => {
          if(err){ throw new Meteor.Error(err.message); }
          return success;
        });
      }
    }
  }),

  create: new ValidatedMethod({
    name: 'businessProfiles.methods.create',
    validate: new SimpleSchema({
      habitat: { type: [String] },
      company_name: { type: String },
      company_email: { type: String },
      company_phone: { type: String },
      company_address: { type: String },
      orderPhone: { type: Number },
      company_type: { type: String },
      company_picture: { type: String },
      method: { type: String },
      geometry: {type: Object },
      'geometry.type': { type: String },
      'geometry.coordinates': { type: [ Number ], decimal: true },
      'geometry.interpolated': {type: Boolean, optional: true },
      notificationPreference: { type: String },
      prep_time: { type: Number },
    }).validator(),
    run() {
      if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        throw new Meteor.Error('501', 'Please sign in as an admin');
      } else {
        return businessProfiles.insert(arguments[0]);
      }
  }
  }),

  rearrangeCategories: new ValidatedMethod({
    name: 'businessProfiles.methods.rearrangeCategories',
    validate: new SimpleSchema({
      bizId: { type: String },
      newCatArray: { type: [String]  },
    }).validator(),
    run({ bizId, newCatArray }) {
      if (!this.isSimulation && Roles.userIsInRole(this.userId, ['vendor']) ||
          !this.isSimulation && Roles.userIsInRole(this.userId, ['admin']) ) {

        return businessProfiles.update(bizId, {$set: { categories: newCatArray }}, (err) => {
          if(err) { throw new Meteor.Error(err.message); } else {
            return businessProfiles.findOne(bizId).categories;
          }
        });
      }
    }
  }),

  addMenuItem: new ValidatedMethod({
    name: 'businessProfiles.methods.addMenuItem',
    validate: new SimpleSchema({
      uid: { type: String },
      name: { type: String },
      description: { type: String },
      category: { type: String },
      price: { type: Number, decimal: true},
      modifiers: { type: [String] },
    }).validator(),
    run({uid}) {
      if (Meteor.user() && Roles.userIsInRole(Meteor.userId(), ['admin', 'vendor'])) {
        arguments[0].company_name = businessProfiles.findOne(uid).company_name;
        return saleItems.insert(arguments[0]);
      } else {
        throwError('Unauthorized');
      }
    }
 }),

 validatePassword: new ValidatedMethod({
   name: 'businessProfiles.methods.validatePassword',
   validate: new SimpleSchema({
     uid: { type: String },
     pass: { type: String, min: 6 },
   }).validator(),
   run({uid, pass}) {
     if (Meteor.isServer) {
       if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
         Accounts.setPassword(uid, pass);
         const usr = Meteor.users.findOne(uid);
         const biz = businessProfiles.findOne({uid: uid});
         if(biz){
           Email.send({
             from: "app@market.tryhabitat.com",
             to: "info@tryhabitat.com",
             subject: `${biz.company_name} password reset`,
             text: `${biz.company_name} new login info:
             Username: ${usr.profile.email}
             Password: ${pass}`,
             html: "",
             headers: "",
           });
         }
       }
     }
   }
 })
};

Meteor.methods({
  setVendorTax(biz, type) {
    if (Meteor.users.findOne(this.userId).roles.includes('admin')) {
      businessProfiles.update(biz, {$set: {tax: type}});
    }
  },
  updateProfile(id, newState){
    if(Meteor.isServer){
      console.log(id);
      console.log(newState);
      if(newState.habitat){
        newState.habitat = newState.habitat.map((habitatIdentifier) => {
          habitat = Habitats.findOne({name: habitatIdentifier}) || Habitats.findOne({_id: habitatIdentifier});
          return habitat._id;
        });
      }

      return businessProfiles.update(id, {$set: newState}, (err) => {
        if(err) { console.warn(err); }
      });
    }
  },

  vendorsNear() {
    if (Meteor.isServer) {
      const co = Meteor.user().profile.geometry.coordinates;
      const rad = Settings.findOne({'name': 'userRadius'}) || {delivery: 1.3, pickup: 2};
      if (!rad.name) {console.warn('NO USER RADIUS SETTING FOUND, REVERTING TO HARD CODED NUMBERS');}
      const ids = businessProfiles.find({
        'geometry.coordinates': {
          $geoWithin: { $centerSphere: [co, rad.delivery/3963.2] }
          }
      }, {fields: {_id: 1}}).fetch();
      return _.pluck(ids, '_id');
    }
  },

  vendorsFar() {
    if (Meteor.isServer) {
      const co = Meteor.user().profile.geometry.coordinates;
      const rad = Settings.findOne({'name': 'userRadius'}) || {delivery: 1.3, pickup: 2};
      if (!rad.name) {console.warn('NO USER RADIUS SETTING FOUND, REVERTING TO HARD CODED NUMBERS');}
      const ids = businessProfiles.find({
        'geometry.coordinates': {
          $geoWithin: { $centerSphere: [co, rad.pickup/3963.2] }
          }
      }, {fields: {_id: 1}}).fetch();
      return _.pluck(ids, '_id');
    }
  },
  updateWeeklyHours (biz, myDay, field, val) {
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    var weekArray = businessProfiles.findOne(biz).weeklyHours;
    var hourObj = _.findWhere(weekArray, {day: myDay});

    if (field === 'open') {
      businessProfiles.update({_id: biz, 'weeklyHours.day': myDay}, {$set: {
        'weeklyHours.$.open': val}
      });
    } else {
      var hour = Number(moment(val, 'h hh, a A').format('H'));
      var min = Number(moment(val, 'HH:mm').format('m'));
      var dayBase = myDay * 86400000;
      var hourBase = hour * 3600000;
      var minBase = min * 60000;
      if (field === 'openHr') {
        var openTime = dayBase + hourBase + minBase;
        businessProfiles.update({_id: biz, 'weeklyHours.day': myDay}, {$set: {'weeklyHours.$.openTime': openTime, 'weeklyHours.$.openHr': val}});
      }
      if (field === 'closeHr') {
        var closeTime = dayBase + hourBase + minBase;
        businessProfiles.update({_id: biz, 'weeklyHours.day': myDay}, {$set: {'weeklyHours.$.closeTime': closeTime, 'weeklyHours.$.closeHr': val}});
      }
    }
  },
  changeBizState(id, type) {
    if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
      businessProfiles.update(id, {$set: {open: type}});
    }
  },
  closeBusinessForToday (bizId) {
    check(bizId, String);
    if (Meteor.isServer) {
      var now = Settings.findOne({name: 'weeklyMilliCount'}).count;
      businessProfiles.update({_id: bizId, 'weeklyHours.day': moment().day()}, { $set: {'weeklyHours.$.quickClose': now}}, (err, res) => {
        if (err) {
          throw new Meteor.Error(err.reason);
        }
      });
    }
  },

  resetTodaysBizHours (bizId) {
    check(bizId, String);
    businessProfiles.update({_id: bizId, 'weeklyHours.day': moment().day()}, { $unset: {'weeklyHours.$.quickClose': ''}}, (err, res) => {
      if (err) {
        throw new Meteor.Error(err.reason);
      }
    });
  },

  updateRates(bizId, method, day, percentNum, flatRate) {
    console.log(percentNum);
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    return businessProfiles.update({_id: bizId, 'weeklyHours.day': day }, {$set: {
        [`weeklyHours.$.vendorRates.${method}.flat`]: parseFloat(flatRate),
        [`weeklyHours.$.vendorRates.${method}.percent`]: parseFloat(0.01 * percentNum)
      }}, (err, res) => { if(err) { throw new Meteor.Error(err.message, err.reason); }
    });
  },

  toggleVendorFreeDelivery(bizId, day, makeFree){
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    businessProfiles.update({_id: bizId, 'weeklyHours.day': day }, {$set: {
      'weeklyHours.$.vendorPremium': makeFree,
      'weeklyHours.$.deliveryFee': makeFree ? 0 : 2.99
    }}, (err) => { if(err) { throw new Meteor.Error(err.message); } });
  },

  updateDeliveryFee(id, day, fee) {
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    return businessProfiles.update({_id: id, 'weeklyHours.day': day }, {$set: {
        'weeklyHours.$.deliveryFee': parseFloat(fee),
      }}, (err, res) => { if(err) { throw new Meteor.Error(err.message, err.reason); }
    });
  },

  updateMinimum(bizId, day, flatRate) {
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    return businessProfiles.update({_id: bizId, 'weeklyHours.day': day }, {$set: {
        [`weeklyHours.$.vendorRates.freeDel.minimum`]: parseFloat(flatRate),
      }}, (err, res) => { if(err) { throw new Meteor.Error(err.message, err.reason); }
    });
  },

  updateFallback(bizId, day, flatRate) {
    if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
    return businessProfiles.update({_id: bizId, 'weeklyHours.day': day }, {$set: {
        [`weeklyHours.$.deliveryFeeMinimumFallback`]: parseFloat(flatRate),
      }}, (err, res) => { if(err) { throw new Meteor.Error(err.message, err.reason); }
    });
  },
});
