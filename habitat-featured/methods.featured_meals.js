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
