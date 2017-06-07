Alerts = new Mongo.Collection('alerts');
Alerts.schema = new SimpleSchema({
  _id: { type: String },
  type: { type: String },
  message: { type: String },
  time: { type: Date },
  closed: { type: Boolean, defaultValue: false }
});
