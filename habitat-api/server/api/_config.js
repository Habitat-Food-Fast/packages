API = {
  authentication( apiKey ) {
    var getUser = APIKeys.findOne( { "key": apiKey });
    return getUser ? getUser.owner : false;
  },
  connection( request ) {
    const getRequestContents = API.utility.getRequestContents( request ),
          apiKey = getRequestContents.api_key,
          validUser = API.authentication( apiKey );
          console.warn(validUser, 'validUser')
    if ( validUser ) {
      return { owner: validUser, data: getRequestContents, key: apiKey };
    } else {
      return { error: 401, message: "Invalid API key." };
    }
  },
  handleRequest( context, resource, method ) {
    var connection = API.connection( context.request );
    if(connection.error){
      APIRequests.insert({method: method, request: context.request, response: connection}, (err) => {
        return API.utility.response( context, 401, connection );
      });
    } else {
      console.log(`${method} to ${Meteor.absoluteUrl()}api/v1/${resource} from ${connection.owner}`);

      call = API.methods[ resource ][ method ]; console.log(call);
      response = call( context, connection );
      console.log('response', response)
      APIRequests.insert({request: connection, response: response}, (err) => {
        if(err) { throwError({reason: `Database connection error inserting API request`})} else {
          return response;
        }
      });
    }
  },
  utility: {
    getRequestContents( request ) {
      console.log(request.method);
      switch(request.method) {
        case "GET":
          return request.body;
        case "POST":
        case "PUT":
        case "DELETE":
          return request.body;
      }
    },
    hasData( data ) {
      return Object.keys( data ).length > 0 ? true : false;
    },
    validate( data, pattern ) {return Match.test( data, pattern ); },
    response( context, statusCode, data ) {
      console.log('response going..',statusCode, data)
      context.response.setHeader( 'Content-Type', 'application/json' );
      context.response.statusCode = statusCode;
      context.response.end( JSON.stringify( data ) );
    },
  }
};
