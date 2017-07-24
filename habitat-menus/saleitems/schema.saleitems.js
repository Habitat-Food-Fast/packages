import SimpleSchema from 'simpl-schema';
saleItems.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  uid: { type: String, regEx: SimpleSchema.RegEx.Id },
  name: { type: String },
  description: { type: String, optional: true },
  category: { type: String, optional: true },
  price: { type: Number, },
  featured: { type: Boolean },
  isHiddenFromMenu: { type: Boolean, },
  modifiers: { type: Array, },
  'modifiers.$': { type: String },
  company_name: { type: String, }
});

saleItems.attachSchema(saleItems.schema);
