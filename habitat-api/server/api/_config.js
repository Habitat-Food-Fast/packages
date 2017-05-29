API = {
  authentication( apiKey ) {
    var getUser = APIKeys.findOne( { "key": apiKey }, { fields: { "owner": 1 } } );
    return getUser ? getUser.owner : false;
  },
  connection( request ) {
    const getRequestContents = API.utility.getRequestContents( request ),
          apiKey = getRequestContents.api_key,
          validUser = API.authentication( apiKey );
          console.log('apiKey', apiKey);
          console.log('validUser', validUser);
    if ( validUser ) {
      return { owner: validUser, data: getRequestContents, key: apiKey };
    } else {
      return { error: 401, message: "Invalid API key." };
    }
  },
  handleRequest( context, resource, method ) {
    var connection = API.connection( context.request );
    console.log('resource and method',resource, method);
    console.log(connection);
    return !connection.error ?
      API.methods[ resource ][ method ]( context, connection ) :
      API.utility.response( context, 401, connection );
  },
  utility: {
    getRequestContents( request ) {
      switch(request.method) {
        case "GET":
          return request.body;
        case "POST":
        case "PUT":
        case "DELETE":
          return request.body;
      }
    },
    hasData( data ) { return Object.keys( data ).length > 0 ? true : false; },
    validate( data, pattern ) { return Match.test( data, pattern ); },
    response( context, statusCode, data ) {
      context.response.setHeader( 'Content-Type', 'application/json' );
      context.response.statusCode = statusCode;
      context.response.end( JSON.stringify( data ) );
    },
  }
};
