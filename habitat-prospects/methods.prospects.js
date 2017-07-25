import SimpleSchema from 'simpl-schema';
Prospects.methods = {
  onboard: new ValidatedMethod({
    name: 'Prospects.methods.onboardSubmerchant',
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
    name: 'Prospects.methods.create',
    validate: new SimpleSchema({
      habitat: { type: String, optional: true },
      company_name: { type: String, optional: true },
      company_address: { type: String, optional: true },
      company_phone: { type: String, optional: true },
      company_type: { type: String, optional: true },
      status: { type: String, optional: true },
      priority: { type: String, optional: true },
      platform_priority: { type: String, optional: true },
      hiring: { type: String, optional: true },
      categories: { type: Array, optional: true },
      'categories.$': { type: String },
      menu_difficulty: { type: String, optional: true },
      eat24: { type: Boolean, optional: true },
      reviews: { type: String, optional: true },
      yelp_rating: { type: Number, optional: true, },
      grubhub: { type: Boolean, optional: true },
      uberEats: { type: Boolean, optional: true },
      postmates: { type: Boolean, optional: true },
      caviar: { type: Boolean, optional: true },
      catering: { type: Boolean, optional: true },
      DaaS: { type: Boolean, optional: true },
      DaaSGH: { type: Boolean },
      notificationPreference: { type: String, optional: true },
      habitatOwnsTablet: { type: Boolean, optional: true },
      serialNumber: { type: Number, optional: true },
      direct_deposit: { type: Boolean, optional: true },
    }).validator(),
    run() {
      // if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
      //   throw new Meteor.Error('501', 'Please sign in as an admin');
      // } else {
        try {
          const insert = Prospects.insert(arguments[0], {validate: false});
          // console.log(insert);
          console.log(arguments[0].yelp_rating);

          return insert;
        } catch(e) {
          throwError(e);
        }
      // }
    }
  })
};

Meteor.methods({
  testmethod() {
    console.log('success');
  }
//   updateProfile(id, newState){
//     console.log(id);
//     console.log(newState);
//     if(newState.habitat){
//       newState.habitat = newState.habitat.map((habitatIdentifier) => {
//         habitat = Habitats.findOne({name: habitatIdentifier}) || Habitats.findOne({_id: habitatIdentifier});
//         return habitat._id;
//       });
//     }
//
//     return Prospects.update({_id: id}, {$set: newState});
//   },
});
