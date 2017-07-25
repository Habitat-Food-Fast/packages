import SimpleSchema from 'simpl-schema';
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
    type: Array,
  },
  'businesses.$': {
    type: String,
  },
});
