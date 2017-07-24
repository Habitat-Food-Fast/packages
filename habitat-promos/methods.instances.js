import SimpleSchema from 'simpl-schema'
Instances.methods = {
  insert: new ValidatedMethod({
    name: 'Instances.methods.insert',
    mixins: [PermissionsMixin],
    allow: [{
      group: true,
      roles: ['admin', 'vendor'],
    }],
    validate: new SimpleSchema({
      name: {type: String},
      ownerId: {type: String},
      acquisition: { type: Boolean },
      dollarAmount: {type: Number, optional: true },
      giveOwnerDiscountOnRedeem: {type: Boolean, optional: true},
      channel: { type: String, optional: true},
      subChannel: { type: String, optional: true},
      ownerRole: { type: String, optional: true },
      habitat: { type: String, optional: true },
      adUnits: { type: SimpleSchema.Integer },
      notes: { type: String },
    }).validator(),
    run() {
      const a = arguments[0],
      PROMO = a.name.toUpperCase();
      console.log('hit inesrt ethod')
      console.log(a);
      // if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
      return a.acquisition ?
        Instances.insertAcquisitionCode(PROMO, a) :
        Instances.insertRetentionCode(PROMO, a);
    }
  }),

  expire: new ValidatedMethod({
    name: 'Instances.methods.expire',
    mixins: [PermissionsMixin],
    allow: [{
      group: true,
      roles: ['admin'],
    }],
    validate: new SimpleSchema({
      _id: {type: String},
      expire: {type: Boolean}
    }).validator(),
    run({_id, expire}) {
      return Instances.update(_id, {$set: {expired: expire}}, (err) => {
        if(err) { throwError(err); }
      });
    }
  }),

  addOwner: new ValidatedMethod({
    name: 'Instances.methods.addOwner',
    validate: new SimpleSchema({
      promoName: {type: String},
    }).validator(),
    run({ promoName }) {
      if(!this.isSimulation){
        const PROMO = promoName.toUpperCase();
        Instances.addOwner(PROMO);
        const openTx = Meteor.users.getOpenTx(this.userId);
        const inst = Instances.findOne({name: PROMO});
        if(openTx){
          Instances.addToTx(inst._id, openTx._id);
        }
      }
    }
  }),
};

Meteor.methods({
  getPromoOwners (promoName) {
    return Instances.getPromoOwners(promoName);
  }
});
