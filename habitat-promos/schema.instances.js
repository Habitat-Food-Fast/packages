import SimpleSchema from 'simpl-schema'

Instances.schema = new SimpleSchema({
  _id: { type: String },
  ownedBy: {
    type: String,
    custom(){
      if(this.isUpdate){ throwError(`Can't update promo owner`); }
    }
  },
  name: {
    type: String,
    custom(){
      if(this.isInsert && Instances.findOne({name: this.value})){
        const fn = Meteor.users.findOne(this.userId).profile.fn.toUpperCase();
        this.value = fn + pinGen();
      }
    }
  },
  dateIssued: { type: Date },
  dollarAmount: { type: Number, },
  owners: { type: Array, },
    'owners.$': { 'type': String },
  redeemedBy: { type: Array, },
    'redeemedBy.$': { type: String },
  redeemedByCount: { type: Number, optional: true, },
  ownersCount: { type: Number, optional: true, },
  habitat: { type: String, },
  ownerRole: { type: String, },
  adUnits: { type: SimpleSchema.Integer, },
  notes: {type: String},
  acquisition: { type: Boolean, },
  giveOwnerDiscountOnRedeem: {
    type: Boolean,
    custom(){ if(this.isUpdate){ throwError(`Can't change promo freeDelivery behavior`); } }
  },
  expired: {
    type: Boolean,
    custom(){
      if(this.isUpdate){
        const inst = Instances.findOne(this.docId);
        if(inst.acquisition && this.value === true){
          throwError(`You can't expire acquisition promos`);
        }
      }
    }
  }, //is the promo usable or not
  channelType: {
    type: String,
    allowedValues: ['physical', 'digital'],
    optional: true
  },
  channel: {
    type: String,
    allowedValues: [
      'direct-solicitation',
      'passive-solicitation',
      'referrals',
      'organic-digital',
      'paid-digital',
      'channel-partnerships'
    ],
    optional: true
  },
  subChannel: {
    type: String,
    allowedValues: [
      'tabling', 'dorm-storming', 'events',
      'door-hangers', 'menus', 'fliers',
      'vendor-poster', 'vendor-cards', 'customer-promo',
      'runner-promo', 'instagram', 'twitter', 'facebook',
      'email', 'seo', 'snapchat', 'sem',
      'email-marketing', 'social-media'
    ],
    optional: true
  }
});

Instances.attachSchema(Instances.schema);


function pinGen(){
 var pinGenerator = Math.floor(Math.random() * (10000 - 99999 +1)) + 10000;
 return Math.abs(pinGenerator);
}
