
FeaturedMeals.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  uid: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  title: {
    type: String,
    trim: true
  },
  company_name: {
    type: String,
    trim: true
  },
  saleItem: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  saleItemName: {
    type: String
  },
  image: {
    type: String
  },
  featured: {
    type: Boolean
  },
  createdAt: {
    type: Date
  },
  description: {
    type: String,
  },
  timesRedeemed: {
    type: Number
  },
  order: {
    type: Number
  },
  habitat: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  deals: {
    type: [String],
    optional: true,
    allowedValues: ['free drink', 'free delivery', 'free side'],
  },
  tag: {
    type: String,
    optional: true
  },
});
FeaturedMeals.attachSchema(FeaturedMeals.schema);
