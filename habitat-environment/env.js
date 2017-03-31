DDPenv = () => {
  if (typeof Habitat === 'undefined') {
    return Meteor;
  } else {
    return Habitat;
  }
}
