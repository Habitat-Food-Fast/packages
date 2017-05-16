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
      habitat: { type: [String] },
      company_name: { type: String },
      company_address: { type: String },
      company_phone: { type: String },
      company_type: { type: String },
      status: { type: String },
      priority: { type: String },
      platform_priority: { type: String },
      hiring: { type: String },
      categories: { type: [String] },
      menu_difficulty: { type: String },
      eat24: { type: Boolean },
      reviews: { type: String },
      yelp_rating: { type: Number },
      grubhub: { type: Boolean },
      uberEats: { type: Boolean },
      postmates: { type: Boolean },
      caviar: { type: Boolean },
      catering: { type: Boolean },
      DaaS: { type: Boolean },
      DaaSGH: { type: Boolean },
      notificationPreference: { type: String },
      habitatOwnsTablet: { type: Boolean },
      serialNumber: { type: Number },
      direct_deposit: { type: Boolean },
    }).validator(),
    run() {
      if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        throw new Meteor.Error('501', 'Please sign in as an admin');
      } else {
        try {
          const insert = Prospects.insert(arguments[0]);
          console.log(insert);
          return insert;
        } catch(e) {
          throwError(e);
        }
      }
    }
  })
};

// Meteor.methods({
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
// });
