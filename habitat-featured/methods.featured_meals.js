import { _ } from 'underscore';
import SimpleSchema from 'simpl-schema';
FeaturedMeals.methods = {
  insert: new ValidatedMethod({
    name: 'FeaturedMeals.methods.insert',
    mixins: [PermissionsMixin],
    allow: [{
      group: true,
      roles: ['admin', 'vendor'],
    }],
    validate: new SimpleSchema({
      'uid': { type: String},
      'title': { type: String },
      'tag': { type: String, optional: true },
      'description': { type: String, optional: true },
      'saleItem': { type: String },
      'image': { type: String },
      'featured': { type: Boolean },
      'deals': {
        type: Array,
        optional: true
      },
      'deals.$': {
        type: String,
        allowedValues: ['free delivery', 'free drink', 'free side']
      },
    }).validator(),
    run() {
      if(!this.isSimulation){
        query = arguments[0]
        bp = businessProfiles.findOne({_id: query.uid});
        if(!bp){
          console.warn(`no bp for ${query.uid}`);
        } else {
          query.company_name = bp? bp.company_name : false;
          query.timesRedeemed = 0;
          query.createdAt = new Date();
          query.saleItemName = saleItems.findOne(query.saleItem) ? saleItems.findOne(query.saleItem).name : '';
          query.order = FeaturedMeals.find().count() + 1;
          query.habitat = bp.habitat[0];
          console.log(query);
          return FeaturedMeals.insert(query, (err) => {
            if(err) { throwError(err.message); }
          });
        }
      }

    }
  }),
  update: {
    image: new ValidatedMethod({
      name: 'FeaturedMeals.methods.update.image',
      mixins: [PermissionsMixin],
      allow: [{
        group: true,
        roles: ['admin', 'vendor'],
      }],
      validate: new SimpleSchema({
        'featuredId': { type: String},
        'photoUrl': { type: String },
      }).validator(),
      run({featuredId, photoUrl}) {
        FeaturedMeals.update(featuredId, {$set: {image: photoUrl}}, (err) => {
          if(err) { throwError(err.message); }
        });
      }
    }),
    info: new ValidatedMethod({
      name: 'FeaturedMeals.methods.update.info',
      mixins: [PermissionsMixin],
      allow: [{
        group: true,
        roles: ['admin', 'vendor'],
      }],
      validate: new SimpleSchema({
        '_id': { type: String },
        'title': { type: String, optional: true, min: 4},
        'tag': { type: String, optional: true },
        'description': { type: String, optional: true, },
        'deals': { type: Array, optional: true },
        'deals.$': { type: String },
      }).validator(),
      run({_id}) {
        FeaturedMeals.update(_id, {$set: arguments[0]}, (err) => {
          if(err) { throwError(err.message); }
        });
      }
    }),
    featured: new ValidatedMethod({
      name: 'FeaturedMeals.methods.update.featured',
      mixins: [PermissionsMixin],
      allow: [{
        group: true,
        roles: ['admin'],
      }],
      validate: new SimpleSchema({
        'featuredId': { type: String},
        'feature': { type: Boolean },
      }).validator(),
      run({featuredId, feature}) {
        FeaturedMeals.update(featuredId, {$set: {featured: feature}}, (err) => {
          if(err) { throwError(err); }
        });
      }
    }),
  },
}
