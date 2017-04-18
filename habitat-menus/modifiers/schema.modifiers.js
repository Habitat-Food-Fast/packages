Modifiers.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  name: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    optional: false,
    decimal: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  uid: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  itemId: {
    type: [String],
    regEx: SimpleSchema.RegEx.Id
  }
});

modCategories.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  name: {
    type: String,
    trim: true
  },
  uid: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  order: {
    type: Number
  },
  selectOne: {
    type: Boolean
  },
  required: {
    type: Boolean
  }
});

modCategories.attachSchema(modCategories.schema);
Modifiers.attachSchema(Modifiers.schema);
