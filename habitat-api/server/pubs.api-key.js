Meteor.publish( 'APIKey', function(){
  const data = APIKeys.find( { "owner": this.userId }, {fields: { "key": 1 } } );
  if (data) { return data; }
  return this.ready();
});
