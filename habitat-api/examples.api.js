Meteor.methods({
  initApiKey( userId ) {
    key = Random.hexString(32)
    APIKeys.insert({
     owner: userId || this.userId,
     key: key,
   }, (err, id) => { if(err) { console.warn(err.message); } else {
     console.log(`APIKey ${id} inserted for ${userId}`);
     return key;
   }});
  },
  regenerateApiKey( userId ){
    newKey = Random.hexString(32);
    APIKeys.update({ "owner": userId || this.userId }, { $set: {
      key: newKey,
    }}, (err, count) => { if(err) { throw new Meteor.Error(err.message); } else {
      console.log(`API Key changed`);
      console.log(newKey);
      if(Meteor.isClient){
        Session.set('myKey', newKey);
      }
      return newKey;
    } });
  },
  exampleReadMethod(argument){
    // Check the argument. Assuming a String type here.
    check(argument, String);

    // Perform the read.
    var exampleItem = Example.findOne(argument);

    // If the read fails (no documents found), throw an error.
    if (!exampleItem) {
      throw new Meteor.Error(500, 'Error 500: Not Found', 'No documents found.');
    }

    // Return either the result or the error.
    return exampleItem;
  },

  exampleRemoveMethod(argument){
    // Check the argument. Assuming a String type here.
    check(argument, String);

    // Perform the remove.
    try {
      var exampleId = Example.remove(argument);
      return exampleId;
    } catch(exception) {
      // If an error occurs, return it to the client.
      return exception;
    }
  }
});
