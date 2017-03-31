Meteor.startup(function(){
  if(Meteor.isServer && !weeks.find().count()){
    weeks.insert({}, (err, res) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        console.log(res + ' week inserted');
      }
    });
  }
});
