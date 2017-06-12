Alerts = new Mongo.Collection('alerts');
const Schemas = {};
Schemas.Alerts = new SimpleSchema({
  _id: { type: String },
  txId: { type: String, optional: true },
  type: {
    type: String,
    allowedValues: ['warning', 'success', 'danger', 'info']
  },
  message: { type: String },
  opened: { type: Date },
  details: { type: Object, optional: true },
  'details.text': { type: String, optional: true },
  'details.user': { type: String, optional: true },
  'details.contact': { type: String, optional: true },
  resolvedAt: { type: Date, optional: true },
  resolved: { type: Boolean, defaultValue: false },
  resolvedBy: { type: String, optional: true }
});

Alerts.attachSchema(Schemas.Alerts);