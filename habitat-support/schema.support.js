SupportTickets.schema = new SimpleSchema({
  _id: {
    type: String
  },
  timeCreated: {
    type: Date,
  },
  timeCompleted: {
    type: Date,
    optional: true
  },
  cronCancelTime: {
    type: Date,
  },
  status: {
    type: String,
    allowedValues: SupportTickets.statuses
  },
  userId: {
    type: String,
    optional: true,
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true,
  },
  name: {
    type: String,
    trim: true,
    optional: true,
  },
  admin: {
    type: String,
    optional: true,
  },
  subject: {
    type: String,
    trim: true,
    optional: true,
  },
  message: {
    type: String,
    optional: true
  },
  fromSite: {
    type: Boolean
  },
  initByAdmin: {
    type: Boolean
  }
});

SupportTickets.attachSchema(SupportTickets.schema);
