Categories.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  name: {
    type: String
  },
  order: {
    type: Number
  },
  businesses: {
    type: [String]
  }
});
