import SimpleSchema from 'simpl-schema'
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
    type: Array,
    regEx: SimpleSchema.RegEx.Id
  },
  'itemId.$': { type: String },
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
