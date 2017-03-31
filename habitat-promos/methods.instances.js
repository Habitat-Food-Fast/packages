Instances.methods = {
  insert: new ValidatedMethod({
    name: 'Instances.methods.insert',
    validate: new SimpleSchema({
      name: {type: String},
      ownerId: {type: String},
      acquisition: { type: Boolean },
      dollarAmount: {type: Number, optional: true, decimal: true},
      giveOwnerDiscountOnRedeem: {type: Boolean, optional: true},
      channel: { type: String, optional: true},
      subChannel: { type: String, optional: true},
    }).validator(),
    run() {
      const a = arguments[0],
      PROMO = a.name.toUpperCase();

      if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
      return a.acquisition ?
        Instances.insertAcquisitionCode(PROMO, a.ownerId, a.giveOwnerDiscountOnRedeem, a.channel, a.subChannel) :
        Instances.insertRetentionCode(PROMO, a.ownerId, a.dollarAmount, a.channel, a.subChannel);
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
