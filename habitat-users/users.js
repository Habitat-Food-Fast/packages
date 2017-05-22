Meteor.users.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  username: {
    type: String,
    trim: true,
    regEx: SimpleSchema.RegEx.Email
  },
  location: {
    type: Object,
    optional: true,
  },
  'location.lng': {
    type: Number,
    optional: true,
    decimal: true,
  },
  'location.lat': {
    type: Number,
    optional: true,
    decimal: true,
  },
  'location.lastUpdated': {
    type: Date,
    optional: true,
  },
  'location.address': {
    type: String,
    optional: true,
  },
  'profile.gender': {
    type: String,
    optional: true,
    allowedValues: [ 'male', 'female', 'none'],
    defaultValue: 'none'
  },
  'emails.$.address': {
    type: String,
    trim: true,
    regEx: SimpleSchema.RegEx.Email
  },
  'emails.$.verified': {
    type: Boolean
  },
  'profile.phone': {
    type: String,
    min: 10,
    max: 10,
    trim: true
  },
  'profile.fn': {
    type: String,
    trim: true
  },
  'profile.ln': {
    type: String,
    trim: true,
    optional: true
  },
  'profile.email': {
    type: String,
    trim: true,
    regEx: SimpleSchema.RegEx.Email
  },
  'profile.loginPin': {
    type: Number,
    optional: true
  },
  'profile.profile_pic': {
    type: String,
    optional: true
  },
  'profile.uuid': {
    type: String,
    optional: true
  },
  'profile.transactions': {
    type: [String],
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  'profile.mealUser': {
    type: Boolean
  },
  'profile.seenOrders': {
    type: Number,
    optional: true
  },
  'profile.settings.push': {
    type: Boolean
  },
  'profile.settings.email': {
    type: Boolean,
    optional: true
  },
  'profile.settings.text': {
    type: Boolean
  },
  'profile.businesses': {
    type: [String],
    optional: true,
    regEx: SimpleSchema.RegEx.Id
  },
  'profile.avgRating': {
    type: Number,
    optional: true,
    decimal: true
  },
  'profile.specialInstructions.$.sid': {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Id
  },
  'profile.specialInstructions.$.instructions': {
    type: String,
    optional: true,
    trim: true
  },
  'profile.habitat': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  'profile.runHabitats': {
    type: [String],
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  'profile.runOrdersCompleted': {
    type: Number,
    optional: true,
  },
  'profile.runnerApproved': {
    type: Boolean,
    optional: true,
  },
  'profile.runnerTransport': {
    type: String,
    optional: true,
  },
  'profile.geometry.type': {
    type: String,
    optional: true
  },
  'profile.geometry.coordinates': {
    type: [Number],
    optional: true,
    decimal: true
  },
  'profile.geometry.interpolated': {
    type: Boolean,
    optional: true
  },
  'profile.geometry.omitted': {
    type: Boolean,
    optional: true
  },
  'profile.address': {
    type: String,
    optional: true
  },
  'profile.myPromo': {
    type: String,
    optional: true,
  },
  'profile.mealCount': {
    type: Number,
    min: 0,
    decimal: true,
    defaultValue: 0,
    optional: true,
  },
  roles: {
    type: [String],
    trim: true,
    allowedValues: ['admin', 'student', 'vendor', 'runner', 'running', 'admin_text', 'scheduled'],
    optional: true
  },
  createdAt: {
    type: Date
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  status: {
      type: Object,
      optional: true,
      blackbox: true
  },
});

Meteor.users.attachSchema(Meteor.users.schema);

Meteor.startup(function(){
  if(Meteor.isServer){
    if(Meteor.users.find().count() === 0){ USER.createInitialUser(); }
    if(!Instances.findOne({name: 'MEALTIME'})){
      // Instances.insertRetentionCode('MEALTIME', Meteor.users.findOne({roles: {$in: ['admin']}})._id, 2.99, channel='physical', subchannel='events');
    }
  }

});

Meteor.users.habitat = () => Habitats.findOne(!Meteor.user() ? Session.get('noUserHabitat') : Meteor.user().profile.habitat);
Meteor.id = () => {
  if(Meteor.isServer) {
    if(!Meteor.userId()) { throw new Meteor.Error(`No user and on server, can't access newBuyerId`); } else { return Meteor.userId(); }
  } else if (Meteor.isClient) {
    if(!Meteor.userId()){return Session.get('newBuyerId'); } else { return Meteor.userId(); }
  }
};

Meteor.users.getOpenTx = (buyerId) => {
  if(Meteor.isClient){
    DDPenv().subscribe('openTx', buyerId);
  }
  return transactions.findOne({
    buyerId: buyerId,
    status: 'created'
  }, {sort: {createdAt: -1}});
};

Meteor.users.getInProgressTxs = (buyerId) => {
  if(Meteor.isClient){
    DDPenv().subscribe('inProgressTxs', buyerId);
  }
  return transactions.find({
    buyerId: buyerId,
    status: {$in: transactions.active() }
  }, {sort: {createdAt: -1}}).fetch();
};

Meteor.users.getMyTx = (txId) => {
  if(Meteor.isClient){
    DDPenv().subscribe('getMyTx', txId);
  }
  if (Meteor.user()) {
    return transactions.find({_id: txId, habitat: Meteor.user().profile.habitat}).fetch();
  } else {
    return transactions.find(txId).fetch();
  }
};

Meteor.users.getAcquisitionCode = () => {
  if(!Meteor.user()) { throwError(`Non-users can't have acquisition codes`); }
  return Instances.findOne({ownedBy: Meteor.userId()});
};



Meteor.users.before.update(function(userId, doc, fieldNames, modifier) {
  if (fieldNames[0] === 'profile' && Meteor.isServer) {
    insertMealRecord(doc, modifier);
  }
});

Meteor.users.deny({
  update() { return true; },
  insert() { return true; },
  remove() { return true; }
});
