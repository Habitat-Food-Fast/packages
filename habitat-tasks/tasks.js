Tasks = new Mongo.Collection('tasks');

if (Meteor.isServer) {
  // This code only runs on the server
  // Only publish tasks that are public or belong to the current user
  Meteor.publish('tasks', () => {
    query = {
     $or: [
       { private: { $ne: true } },
       { owner: this.userId },
     ],
    };
    debugger;
    // modifiers = {
    //   limit: 100,
    //   // sort: {
    //   //   createdAt: -1,
    //   // },
    //   fields: {
    //     username: 1,
    //     text: 1,
    //     private: 1,
    //     owner: 1,
    //     checked: 1,
    //   },
    // }
    return Tasks.find(query);
  });
}

Tasks.methods = {
  insert: new ValidatedMethod({
  name: 'Tasks.methods.insert',
  mixins : [LoggedInMixin],
  checkLoggedInError: {
    error: 'notLogged',
    message: 'You need to be logged in to call this method',
    reason: 'You need to login'
  },
  validate: new SimpleSchema({
    text: { type: String, min: 3, }
  }).validator(),
  run({ text }) {
    console.log(text)
    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
  //    private: false,
    }, (err, id) => { if(err) { throw new Meteor.Error(err.message); } else {
        if(Meteor.isServer){
          Tasks.update(id, {$set: {
            key: getKey(text),
          }}, (err, num) => {
            if(err) { console.warn(err.message);
          }})
        }
        console.log(`you just inserted ${id}`);
      }
    });
  }
}),
};

Meteor.methods({
  'tasks.remove'(taskId) {
    check(taskId, String);

    const task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
     // If the task is private, make sure only the owner can delete it
     throw new Meteor.Error('not-authorized');
    }

    Tasks.remove(taskId);
  },
  'tasks.setChecked'(taskId, setChecked) {
    check(taskId, String);
    check(setChecked, Boolean);

    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { checked: setChecked } });
  },
  'tasks.setPrivate'(taskId, setToPrivate) {
    check(taskId, String);
    check(setToPrivate, Boolean);

    const task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } }, (err) => {
      if(err) {console.warn(err.message); }
    });
  },
});
