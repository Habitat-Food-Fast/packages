saleItems.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  uid: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  name: {
    type: String
  },
  description: {
    type: String,
    optional: true
  },
  category: {
    type: String,
    optional: true
  },
  price: {
    type: Number,
    decimal: true
  },
  featured: {
    type: Boolean
  },
  isHiddenFromMenu: {
    type: Boolean,
  },
  modifiers: {
    type: [String],
  },
  company_name: {
    type: String,
  }
});

saleItems.attachSchema(saleItems.schema);
