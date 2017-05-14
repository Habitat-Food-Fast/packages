Meteor.methods({
  insertFeaturedMeal(mealObj) {
  if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
  if (!mealObj.habitat) {
    mealObj.habitat = businessProfiles.findOne(mealObj.uid).habitat[0];
  }
  FeaturedMeals.insert(
    _.extend(mealObj, {order: FeaturedMeals.find().count() + 1})
  );
},

updateFeaturedMeal(mealId, mealTitle, mealSaleItem, deals, tag, flash, photoUrl) {
  if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) { throw new Meteor.Error('unauthorized'); }
  if (photoUrl) {
    FeaturedMeals.update({_id: mealId}, {$set: {title: mealTitle, saleItem: mealSaleItem, image: photoUrl, deals, tag, flash}});
  } else {
    FeaturedMeals.update({_id: mealId}, {$set: {title: mealTitle, saleItem: mealSaleItem, deals, tag, flash}});
  }
},

removeFeaturedMeal(mealId) {
  if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
    FeaturedMeals.remove({_id: mealId});
  }
},

});

FeaturedMeals.methods = {
  insert: new ValidatedMethod({
    name: 'FeaturedMeals.methods.insert',
    validate: new SimpleSchema({
      'uid': { type: String},
      'title': { type: String },
      'tag': { type: String },
      'description': { type: String },
      'saleItem': { type: String },
      'image': { type: String },
      'featured': { type: Boolean },
      'deals': { type: [String] , optional: true, allowedValues: ['free delivery', 'free drink', 'free side']},
    }).validator(),
    run() {
      if(!Meteor.user() || !Meteor.user().roles.includes('admin')) {
        throwError('Must be admin to insert DaaS');
      } else {
        if(!this.isSimulation){
          query = arguments[0]
          bp = businessProfiles.findOne({_id: query.uid});
          if(!bp){
            console.warn(`no bp for ${query.uid}`);
          } else {
            query.company_name = bp? bp.company_name : false;
            query.timesRedeemed = 0;
            query.createdAt = new Date();
            query.saleItemName = saleItems.findOne(query.saleItem) ? saleItems.findOne(query.saleItem).name : '';
            return FeaturedMeals.insert(query, (err) => {
              if(err) { console.warn(err.message); }
            });
          }
        }
      }
    }
  }),
  update: {
    image: new ValidatedMethod({
      name: 'FeaturedMeals.methods.update.image',
      mixins: [PermissionsMixin],
      allow: [{
        group: true,
        roles: ['admin', 'vendor'],
      }],
      validate: new SimpleSchema({
        'featuredId': { type: String},
        'photoUrl': { type: String },
      }).validator(),
      run({featuredId, photoUrl}) {
        FeaturedMeals.update(featuredId, {$set: {image: photoUrl}}, (err) => {
          if(err) { throwError(err.message); }
        });
      }
    }),
  }
}
