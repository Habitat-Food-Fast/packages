FeaturedMeals = new Mongo.Collection('featured_meals');
FeaturedMeals.initEasySearch(['title', 'company_name'], {
  'limit': 20,
  'use': 'mongo-db',
  'convertNumbers': true
});
