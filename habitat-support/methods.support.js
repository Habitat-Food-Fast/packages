SupportTickets.alerts = {
  create: {
    title: 'Open live support?',
    text: `What's the issue? (optional)`,
    type: 'input',
    showCancelButton: true,
    closeOnConfirm: true,
    closeOnCancel: true,
    inputPlaceholder: ''
  },
};
SupportTickets.methods = {
  insert: new ValidatedMethod({
    name: 'SupportTickets.methods.insert',
    validate: new SimpleSchema({
      fromSite: { type: Boolean },
      newBuyerId: { type: Boolean, },
      userId: { type: String, optional: true},  //for in-app
      email: { type: String, optional: true },  //if anon
      name: { type: String, optional: true },  //if anon
      message: { type: String, optional: true }, //if anon
    }).validator(),
    run({ userId, fromSite }) {
      const id =  SupportTickets.insert(arguments[0]);

      const msg = arguments[0].message ?
`New support ticket opened!
Message: ${arguments[0].message}
https://market.tryhabitat.com/admin/support
` :
`New support ticket opened!
https://market.tryhabitat.com/admin/support
`;
  const url = Meteor.settings.devMode ?
  `https://slack.com/api/chat.postMessage?token=xoxp-5035054269-5013398260-125125457156-69229627575c2ed0b35eddb954913e91&channel=dev-operations&text=NEW-SUPPORT-TICKET&pretty=1` :
  `https://slack.com/api/chat.postMessage?token=xoxp-5035054269-5013398260-125125457156-69229627575c2ed0b35eddb954913e91&channel=support&text=NEW-SUPPORT-TICKET&pretty=1`;
  console.log(url);
  console.log(Meteor.settings.slackToken);
  console.log(msg);
      HTTP.post(url, {mrkdwn: true}, (err,res) => {
        if(err) {
          throwError(err.message);
        }
      });
      return id;
    },
  }),

  //only on site
  customerSend: new ValidatedMethod({
    name: 'SupportTickets.methods.customerSend',
    validate: new SimpleSchema({
      ticketId: { type: String, },
      msg: { type: String, },
    }).validator(),
    run({ ticketId, msg }) {
      const ticket = SupportTickets.findOne(ticketId);
      return Messages.insert({
        uid: null,
        msg: msg,
        ts: new Date(),
        room: ticket._id,
        type: 'support',
        seenByAdmin: false,
        seenByBuyer: true
      }, (err, res) => {
        if(err){ throw new Meteor.Error(err.message); }
      });
    },
  }),

  assignAdmin: new ValidatedMethod({
    name: 'SupportTickets.methods.assignAdmin',
    validate: new SimpleSchema({
      ticketId: { type: String, },
      adminId: { type: String, },
    }).validator(),
    run({ ticketId, adminId }) {
      const ticket = SupportTickets.findOne(ticketId);
      SupportTickets.update(ticketId, {
        $set: {
          status: 'in-progress',
          admin: adminId
        }
      }, (err, res) => { if(err){ throw new Meteor.Error(err.message); } });
    },
  }),

  completeTicket: new ValidatedMethod({
    name: 'SupportTickets.methods.completeTicket',
    validate: new SimpleSchema({
      ticketId: { type: String },
    }).validator(),
    run({ ticketId }) {
      SupportTickets.update(ticketId, { $set: {
        status: 'complete',
        timeCompleted: new Date(),
      }}, (err, res) => {
        if(err){ throw new Meteor.Error(err.message); }
      });
    },
  }),
};

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

Notifications = new Mongo.Collection("notifications");
Notifications.methods = {
  user(){ return Meteor.user(); },
  push(docId, messageId){
    const tx = transactions.findOne(docId);
    const supp = SupportTickets.findOne(docId);
    const msg = Messages.findOne(messageId).msg;

    if(!tx && !supp){ throw new Meteor.Error('Notifications.methods.push', 'Unrecognized message condition'); } else {
      const isAdmin = supp && supp.uid === this.user()._id || tx && this.user().roles.includes('admin');
      const message = {
        to: tx ? tx.buyerId :
          isAdmin ? supp.uid : supp.userId,
        content: tx ?
        `${tx && tx.runnerId === this.user()._id ?
            Meteor.users.findOne(tx.runnerId).profile.fn :
            Meteor.users.findOne(tx.buyerId).profile.fn}: ${msg}. ` :
        `Support: ${msg}`,
        previous: Notifications.findOne({to: this.to}, {sort: {addedAt: -1}})
      };

      Notifications.insert({
        badge: message.previous && message.previous.badge ? message.previous.badge + 1 : 1,
        type: tx ? 'transact' : 'support',
        addedAt: Date(),
        to: message.to,
        content: message.content
      }, (error, result) => {
        if (!error) {

        }
      });
    }
  },
};
