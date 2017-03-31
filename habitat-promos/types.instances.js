Instances.types = [
  {
    type: 'physical',
    channels: [
      { name: 'direct-solicitation',
        subChannels: [ 'dorm-storming', 'tabling', 'events']
      }, {
        name: 'passive-solicitation',
        subChannels: [ 'door-hangers', 'menus', 'fliers', 'vendor-poster']
      },
      {
       name: 'referrals',
       subChannels: [ 'vendor-cards', 'customer-promo', 'runner-promo']
     },
    ]
  }, {
    type: 'digital',
    channels: [
      {
        name: 'organic-digital',
        subChannels: ['instagram', 'twitter', 'facebook', 'email', 'seo']
      }, {
        name: 'paid-digital',
        subChannels: ['instagram', 'twitter', 'facebook', 'snapchat', 'sem']
      }, {
        name: 'channel-partnerships',
        subChannels: ['email-marketing', 'fliers', 'social-media']
      }
    ]
  },
];
