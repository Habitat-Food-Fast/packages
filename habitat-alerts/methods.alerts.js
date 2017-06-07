Meteor.methods({
  insertTest() {
    Alerts.insert({test: 'fuck', yeah: 'shit'});
  }
});
