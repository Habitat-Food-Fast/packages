Router.route( '/api/v1/support', function() {
  console.log('hit support route');
  Meteor.call('getShiftedAdmin', (err, res) => {
    if(err) { console.warn(err.message); } else {
      this.response.writeHead(200);
      if(res.length){
        this.response.end(phone);
      } else {
        console.warn(`no shifts found!`);
        this.response.end();
      }



    }
  });
}, { where: 'server' } );

Meteor.methods({
  getShiftedAdmin(){
    shifts = runner.getShifted(false, false, staffJoy.allHabitats(), 'dispatch');
    return shifts;
  },
});