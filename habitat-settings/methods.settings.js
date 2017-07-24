import { _ } from 'underscore';
import SimpleSchema from 'simpl-schema';
Settings.methods = {
  updateFeedOrder: new ValidatedMethod({
    name: 'Settings.methods.updateFeedOrder',
    validate: new SimpleSchema({
      sortVal: { type: String }
    }).validator(),
    run({ sortVal }) {
      if (_.contains(Meteor.user().roles, 'admin')) {
        Settings.update({name: 'sortVendorFeed'}, { $set: { by: sortVal}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  updateGlobalTip: new ValidatedMethod({
    name: 'Settings.methods.updateGlobalTip',
    validate: new SimpleSchema({
      tip: { type: Number, min: 0, max: 5 }
    }).validator(),
    run({tip}) {
      if (_.contains(Meteor.user().roles, 'admin')) {
        Settings.update({name: 'globalTipAmount'}, {$set: {amount: tip}})
      } else {
        throw new Meteor.Error('No Access');
      }
    }
  }),
  insertParentPromo:  new ValidatedMethod({
    name: 'Settings.methods.insertParentPromo',
    validate: new SimpleSchema({
      promo: { type: String }
    }).validator(),
    run({ promo }) {
      if (_.contains(Meteor.user().roles, 'admin')) {
        Settings.upsert({name: 'parentPromos'}, {$push: {codes: promo}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  changeMainFeed: new ValidatedMethod({
    name: 'Settings.methods.changeMainFeed',
    validate: new SimpleSchema({
      feedVal: { type: String }
    }).validator(),
    run({ feedVal }) {
      if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
        Settings.upsert({'name': 'mainFeed'}, {$set : {'feed': feedVal}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  globalState: new ValidatedMethod({
    name: 'Settings.methods.globalState',
    validate: new SimpleSchema({
      state: { type: Boolean }
    }).validator(),
    run({ state }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        Habitats.update({}, {$set: {'open': state}}, {multi: true});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  mealActive: new ValidatedMethod({
    name: 'Settings.methods.mealActive',
    validate: new SimpleSchema({
      state: { type: Boolean }
    }).validator(),
    run({ state }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        Settings.upsert({'name': 'mealsOpen'}, {$set : {'enabled': state}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  updateMessage: new ValidatedMethod({
    name: 'Settings.methods.updateMessage',
    validate: new SimpleSchema({
      text: { type: String }
    }).validator(),
    run({ text }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        var updateMessageSetting = Settings.findOne({name: 'updateMessage'});
        if (updateMessageSetting !== undefined) {
          Settings.update({name: 'updateMessage'}, {$set: { message: text }});
        } else {
          Settings.insert({name: 'updateMessage', message: text});
        }
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  globalOrderMethod: new ValidatedMethod({
    name: 'Settings.methods.globalOrderMethod',
    validate: new SimpleSchema({
      orderType: { type: String }
    }).validator(),
    run({ orderType }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        var pickupOnlySetting= Settings.findOne({name: 'orderTypeRestriction'});
        if (pickupOnlySetting !== undefined) {
          Settings.update({name: 'orderTypeRestriction'}, {$set: {type: orderType}});
        } else {
          Settings.insert({name: 'orderTypeRestriction', type: orderType});
        }
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  makeAnnouncement: new ValidatedMethod({
    name: 'Settings.methods.makeAnnouncement',
    validate: new SimpleSchema({
      title: { type: String },
      body: { type: String },
      buttonTxt: { type: String},
      habitats: { type: Array, optional: true},
      'habitats.$': { type: String },
    }).validator(),
    run({ title, body, buttonTxt, habitats }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        if (!habitats) {
          habitats = _.pluck(Habitats.find().fetch(), '_id');
        }
        for (i = 0; i < habitats.length; i++) {
          Settings.upsert({name: 'habitatAnnouncement', habitat: habitats[i]}, {$set: {title: title, body: body, button: buttonTxt, seen: []}});
        }
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  deleteAnnouncement: new ValidatedMethod({
    name: 'Settings.methods.deleteAnnouncement',
    validate: new SimpleSchema({
      habitat: { type: String, optional: true}
    }).validator(),
    run({ habitat }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        if (!habitat) {
          Settings.remove({name: 'habitatAnnouncement'}, {multi: true});
        } else {
          Settings.remove({name: 'habitatAnnouncement', habitat: habitat});
        }
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),

  userSeeAnnouncement: new ValidatedMethod({
    name: 'Settings.methods.userSeeAnnouncement',
    validate: null,
    run() {
      Settings.update({name: 'habitatAnnouncement', habitat: Meteor.user().profile.habitat}, {$push: {seen: Meteor.userId()}});
      if(this.isSimulation) {
        analytics.track('User saw announcement', {
          content: Settings.findOne({
            name: 'habitatAnnouncement',
            habitat: this.userId ?
              Meteor.user().profile.habitat :
              Session.get('noUserHabitat')
          })
        });
      }
    }
  }),
  updateMealSort: new ValidatedMethod({
    name: 'Settings.methods.updateMealSort',
    validate: new SimpleSchema({
      sortSetting: { type: String }
    }).validator(),
    run({ sortSetting }) {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        Settings.upsert({name: 'sortMealsFeed'}, {$set: {name: 'sortMealsFeed', by: sortSetting}});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
  setPush: new ValidatedMethod({
    name: 'Settings.methods.setPush',
    validate: new SimpleSchema({
      title: { type: String },
      text: { type: String },
    }).validator(),
    run({ title, text }) {
      if (Roles.userIsInRole(this.userId, 'admin')) {
        Settings.update({name: 'pushContent'}, {$set: {
          title: title,
          text: text
        }});
      } else {
        throw new Meteor.Error('Unauthorized client');
      }
    }
  }),
};

Meteor.methods({
  toggleMethodRestrictions(orderType) {
    if (!Roles.userIsInRole(this.userId, ['admin'])) { throw new Meteor.Error('unauthorized'); }
    Settings.update({name: 'orderTypeRestriction'}, {$set: {type: orderType}});
  },
});
