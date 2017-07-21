import SimpleSchema from 'simpl-schema';
weeks.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  week: {
    type: Number
  },
  lock: {
    type: Boolean,
    optional: true,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  runnerPayouts: {
    type: Array,
  },
  'runnerPayouts.$': {
    type: Object,
    blackbox: true,
    optional: true,
  }
});

weeks.attachSchema(weeks.schema);
