# Research Request: Retrofit 2 + OkHttp SSE

Requested by: api-dev
For tasks: 17003, 17004

Questions:
- What are the latest stable Maven coordinates for com.squareup.retrofit2:retrofit, com.squareup.retrofit2:converter-gson (or converter-moshi), and com.squareup.okhttp3:okhttp?
- How do you define a Retrofit interface with @GET and @POST annotations, including @Path, @Query, and @Body parameters, returning suspend functions with Response<T>?
- How do you configure a Retrofit instance with a base URL, OkHttpClient, and a JSON converter factory in a Hilt @Module?
- What is the correct OkHttp API for Server-Sent Events (SSE): how to open an EventSource, handle onEvent/onFailure/onClosed callbacks?
- Does OkHttp's EventSource support automatic reconnect, or must it be implemented manually? What is the recommended exponential backoff pattern?
- How do you cleanly close/cancel an OkHttp EventSource when a Kotlin coroutine scope is cancelled?
- How do you emit SSE events as a Kotlin Flow or StateFlow from a callback-based EventSource listener?
- What is the correct Content-Type header and request format for Hubitat Maker API POST commands?
