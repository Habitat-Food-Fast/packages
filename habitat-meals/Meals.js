class invoicesCollection extends Mongo.Collection {
  insert(mealPlan, btRes, type, callback) {
    console.log('inside invoice', mealPlan);
    return super.insert({
      meals: mealPlan.meals,
      mealArray: [],
      billing: mealPlan.billing,
      uid: mealPlan.uid,
      braintreeTxId: btRes.transaction.id,
      total: btRes.transaction.amount,
      timeStamp: Date.now(),
      type: type,
      seen: false,
    }, (err, invoiceId) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        if (!Meteor.users.findOne(mealPlan.uid).profile.mealCount) {
          Meteor.users.update(mealPlan.uid, {$set: {'profile.mealCount': 0}});
        }
        Meteor.users.update(mealPlan.uid, {$inc: {'profile.mealCount': mealPlan.meals}});
        Meteor.call('sendMealPlanReceiptEmail', invoiceId);
        // return weeks.addToWeek(this._name, invoiceId);
      }
    });
  }
}
export const Invoices = new invoicesCollection("invoices");
Invoices.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  uid: {
    type: String
  },
  timeStamp: { type: Number },
  type: {
    type: String,
    allowedValues: ['twoWeeks', 'oneMonth', 'halfSem', 'fullSem', 'meal_plan_custom', 'reissue', 'admin']
  },
  braintreeTxId: {
    type: String,
    optional: true
  },
  total: {
    type: String
  },
  meals: {
    type: Number,
  },
  mealArray: {
    type: [String],
    optional: true,
  },
  deliveries: {
    type: Number,
    optional: true
  },
  billing: {
    type: Object,
    optional: true
  },
  'billing.fn': {
    type: String
  },
  'billing.ln': {
    type: String
  },
  'billing.email': {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  'billing.address': {
    type: String
  },
  'billing.city': {
    type: String
  },
  'billing.state': {
    type: String
  },
  'billing.zip': {
    type: String
  },
  seen: {
    type: Boolean,
    optional: true
  }
});
Invoices.attachSchema(Invoices.schema);
Invoices.find({}).observe({
  changed(id, fields){
    JSON.stringify(Invoices.findOne(id), null, 2);
  }
});

Meteor.methods({
  giveUserMeals(userId, mealNum) {
    if(Roles.userIsInRole(this.userId, 'admin')){
      mealPlan = {
        uid: userId,
        meals: mealNum
      };
      res = {
        transaction: {
          amount: 0
        }
      };
    return Invoices.insert(mealPlan, res, 'reissue');
    }
  },
  incMealCount(userId, mealAmount){
    if(Roles.userIsInRole(Meteor.userId(), ['admin'])){
      return Meteor.users.update(userId, {$inc: {'profile.mealCount': mealAmount}}, (err) => {
        if(err) { throw new Meteor.Error(err.message); }
      });
    } else {
      throw new Meteor.Error('Unauthorized');
    }

  }
});
