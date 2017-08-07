
Meteor.users.initEasySearch(['profile.fn', 'profile.email', 'profile.phone'], {
'limit': 20,
'use': 'mongo-db',
'convertNumbers': false
});

Prospects.initEasySearch(['company_name', 'company_address', 'habitat'], {
'limit': 20,
'use': 'mongo-db',
'convertNumbers': false
});
