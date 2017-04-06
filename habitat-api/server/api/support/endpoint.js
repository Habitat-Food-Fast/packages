Router.route( '/api/v1/support', function() {
  console.log('hit support route');
  Meteor.call('getShiftedAdmin', (err, res) => {
    if(err) { console.warn(err.message); } else {
      console.log(res[0].shift.user.profile.phone);
    }
  });
}, { where: 'server' } );

Meteor.methods({
  getShiftedAdmin(){
    shifts = runner.getShifted(false, false, habitats=staffJoy.allHabitats(), 'dispatch');
    return shifts;
  },
});
