Meteor.startup(function(){
  if(Meteor.isServer){
    if(!Meteor.settings.public.apiUrl){
      throw new Meteor.Error(`Missing apiUrl in settings file`);
    }
    if(!Meteor.settings.sentryKey){
      throw new Meteor.Error(`Missing server sentryKey in settings file`);
    }
    if(!Meteor.settings.public.inspectorMode){
      throw new Meteor.Error(`Missing client sentryKey in settings file`);
    }
    if(!Meteor.settings.twilio.phone){
      throw new Meteor.Error(`Missing client sentryKey in settings file`);
    }
  }
});

const round = (amt) => (Math.round(amt * 100) / 100)
