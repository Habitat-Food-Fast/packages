FeaturedMeals = new Mongo.Collection('featured_meals');
FeaturedMeals.initEasySearch(['title'], {
  'limit': 20,
  'use': 'mongo-db',
  'convertNumbers': true
});
