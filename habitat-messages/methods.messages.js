if(Meteor.isServer) { Messages._ensureIndex({uid: 1}); }

Messages.methods = {
  sendMessage: new ValidatedMethod({
    name: 'Messages.methods.sendMessage',
    validate: new SimpleSchema({
      docId: { type: String },
      msg: { type: String },
      uid: { type: String, optional: true},
    }).validator(),
    run({ docId, msg, uid } ) {
      console.log(`transactions is ${typeof transactions}`);
      const tx = transactions.findOne(docId);
      const support = SupportTickets.findOne(docId);

      const usr = Meteor.users.findOne(this.userId);

      return Messages.insert({
        uid: uid || this.userId,
        pic: this.userId ? usr.profile.profile_pic : '',
        msg: msg,
        type: tx ? 'transact' : 'support',
        ts: new Date(),
        room: docId,
        seenByAdmin: false,
        seenByBuyer: false
      }, (err, messageId) => { if (err) { throw new Meteor.Error(err.message); } else {
        if(!this.isSimulation){
          Notifications.methods.push(docId, messageId);
        }
      }});
    }
  })
};
