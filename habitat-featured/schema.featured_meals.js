
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
  saleItem: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  image: {
    type: String
  },
  featured: {
    type: Boolean
  },
  createdAt: {
    type: Number
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
    optional: true
  },
  tag: {
    type: String,
    optional: true
  },
  flash: {
    type: Object,
    optional: true
  },
  'flash.isFlash': {
    type: Boolean,
    optional: true
  },
  'flash.expires': {
    type: Object,
    optional: true
  },
  'flash.expires.stamp': {
    type: Date,
    optional: true
  },
  'flash.expires.hour': {
    type: Number,
    optional: true
  },
  'flash.expires.min': {
    type: Number,
    optional: true
  },
  'flash.prep': {
    type: Number,
    optional: true
  },
  'flash.delivery': {
    type: Number,
    optional: true
  },
  'flash.quantity': {
    type: Number,
    optional: true
  },
  'flash.readyAt': {
    type: Boolean,
    optional: true
  }
});
FeaturedMeals.attachSchema(FeaturedMeals.schema);
