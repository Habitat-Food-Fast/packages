class supportTicketsCollection extends Mongo.Collection {
  user(){ return Meteor.user(); }
<<<<<<< HEAD
  userId(){ return Meteor.userId() || remoteClient.userId(); }
=======
  userId(){ return Meteor.userId(); }
>>>>>>> c712a835f28c6b74b93e3aee19e7efcf603dddec
  insert(doc) {
    const usr = Meteor.users.findOne(doc.userId);
    const supportReq = {
      subject: doc.message,
      prof(usr, field){ //user email, fallback to email field on site, fallback to nothing
        return usr ? usr.profile[field] :
          doc ? doc[field] :
            '';
      }
    };
    return super.insert({
      timeCreated: moment(new Date()).format(),
      cronCancelTime: moment(new Date()).add(5, 'm').format(),
      subject: supportReq.subject,
      email: supportReq.prof(usr, 'email'),
      name: supportReq.prof(usr, 'name') || usr.profile.fn,
      userId: doc.userId,
      admin: this.userId() && Meteor.user().roles.includes('admin') ? this.userId() : '',
      initByAdmin: this.userId() && Meteor.user().roles.includes('admin'),
      status: 'pending',
      fromSite: doc.fromSite
    }, (err, id) => { if(err) { throwError(err.message, err.reason); } else {
      const ticket = SupportTickets.findOne(id);
      if (!ticket.fromSite){
        Messages.methods.sendMessage.call({
          docId: id,
          msg: `Ticket ${id.substr(0,5)}.
          ${ticket.subject ? ticket.subject : ''}`,
          uid: 'CHATBOT', //robot
        });
      }
      this.sendAdminAlert(ticket);
      return id;
    }});
  }

  sendAdminAlert(ticket) {
    Messages.methods.sendMessage.call({
      docId: ticket._id,
      msg: `Pinging Habitat support...`,
      uid: 'CHATBOT'//robot messsage
    },
    (err, res) => {
      if(err) { throw new Meteor.Error(err.message); } else {
        // TODO: ping user via push, etc that they have  a new support ticket open
      }
    });
  }
}

SupportTickets = new supportTicketsCollection("support_tickets");
Messages = new Mongo.Collection("messages");

SupportTickets.statuses = ['pending', 'in-progress', 'complete', 'exited', 'timed-out'];
