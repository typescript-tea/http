## Modules

<dl>
<dt><a href="#module_Http">Http</a></dt>
<dd></dd>
<dt><a href="#module_Result">Result</a></dt>
<dd></dd>
</dl>

<a name="module_Http"></a>

## Http

* [Http](#module_Http)
    * [.get()](#module_Http.get)
    * [.post()](#module_Http.post)
    * [.request()](#module_Http.request)
    * [.header()](#module_Http.header)
    * [.emptyBody()](#module_Http.emptyBody)
    * [.jsonBody()](#module_Http.jsonBody)
    * [.stringBody()](#module_Http.stringBody)
    * [.bytesBody()](#module_Http.bytesBody)
    * [.fileBody()](#module_Http.fileBody)
    * [.expectString()](#module_Http.expectString)
    * [.expectJson()](#module_Http.expectJson)
    * [.expectBytes()](#module_Http.expectBytes)
    * [.expectWhatever()](#module_Http.expectWhatever)
    * [.expectStringResponse()](#module_Http.expectStringResponse)
    * [.expectBytesResponse()](#module_Http.expectBytesResponse)
    * [.cancel()](#module_Http.cancel)
    * [.track()](#module_Http.track)
    * [.fractionSent()](#module_Http.fractionSent)
    * [.fractionReceived()](#module_Http.fractionReceived)

<a name="module_Http.get"></a>

### Http.get()
Create a `GET` request.
```ts
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = "https://elm-lang.org/assets/public-opinion.txt"
        , expect = Http.expectString GotText
        }
```
You can use functions like [`expectString`](#expectString) and
[`expectJson`](#expectJson) to interpret the response in different ways. In
this example, we are expecting the response body to be a `String` containing
the full text of _Public Opinion_ by Walter Lippmann.
**Note:** Use [`elm/url`](/packages/elm/url/latest) to build reliable URLs.

<a name="module_Http.post"></a>

### Http.post()
Create a `POST` request. So imagine we want to send a POST request for
some JSON data. It might look like this:
```ts
    import Http
    import Json.Decode exposing (list, string)
    type Msg
      = GotBooks (Result Http.Error (List String))
    postBooks : Cmd Msg
    postBooks =
      Http.post
        { url = "https://example.com/books"
        , body = Http.emptyBody
        , expect = Http.expectJson GotBooks (list string)
        }
```
Notice that we are using [`expectJson`](#expectJson) to interpret the response
as JSON. You can learn more about how JSON decoders work [here][] in the guide.
We did not put anything in the body of our request, but you can use functions
like [`stringBody`](#stringBody) and [`jsonBody`](#jsonBody) if you need to
send information to the server.
[here]: https://guide.elm-lang.org/interop/json.html

<a name="module_Http.request"></a>

### Http.request()
Create a custom request. For example, a PUT for files might look like this:
```ts
  import File
  import Http
  type Msg = Uploaded (Result Http.Error ())
  upload : File.File -> Cmd Msg
  upload file =
    Http.request
      { method = "PUT"
      , headers = []
      , url = "https://example.com/publish"
      , body = Http.fileBody file
      , expect = Http.expectWhatever Uploaded
      , timeout = Nothing
      , tracker = Nothing
      }
```
It lets you set custom `headers` as needed. The `timeout` is the number of
milliseconds you are willing to wait before giving up. The `tracker` lets you
[`cancel`](#cancel) and [`track`](#track) requests.

<a name="module_Http.header"></a>

### Http.header()
Create a `Header`.
```ts
  header "If-Modified-Since" "Sat 29 Oct 1994 19:43:31 GMT"
  header "Max-Forwards" "10"
  header "X-Requested-With" "XMLHttpRequest"
```

<a name="module_Http.emptyBody"></a>

### Http.emptyBody()
Create an empty body for your `Request`. This is useful for GET requests
and POST requests where you are not sending any data.

<a name="module_Http.jsonBody"></a>

### Http.jsonBody()
Put some JSON value in the body of your `Request`. This will automatically
add the `Content-Type: application/json` header.

<a name="module_Http.stringBody"></a>

### Http.stringBody()
Put some string in the body of your `Request`. Defining `jsonBody` looks
like this:
```ts
    import Json.Encode as Encode
    jsonBody : Encode.Value -> Body
    jsonBody value =
      stringBody "application/json" (Encode.encode 0 value)
```
The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
of the body. Some servers are strict about this!

<a name="module_Http.bytesBody"></a>

### Http.bytesBody()
Put some `Bytes` in the body of your `Request`. This allows you to use
[`elm/bytes`](/packages/elm/bytes/latest) to have full control over the binary
representation of the data you are sending. For example, you could create an
`archive.zip` file and send it along like this:
```ts
    import Bytes exposing (Bytes)
    zipBody : Bytes -> Body
    zipBody bytes =
      bytesBody "application/zip" bytes
```
The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
of the body. In other scenarios you may want to use MIME types like `image/png`
or `image/jpeg` instead.
**Note:** Use [`track`](#track) to track upload progress.

<a name="module_Http.fileBody"></a>

### Http.fileBody()
Use a file as the body of your `Request`. When someone uploads an image
into the browser with [`elm/file`](/packages/elm/file/latest) you can forward
it to a server.
This will automatically set the `Content-Type` to the MIME type of the file.
**Note:** Use [`track`](#track) to track upload progress.

<a name="module_Http.expectString"></a>

### Http.expectString()
Expect the response body to be a `String`. Like when getting the full text
of a book:
```ts
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = "https://elm-lang.org/assets/public-opinion.txt"
        , expect = Http.expectString GotText
        }
```
The response body is always some sequence of bytes, but in this case, we
expect it to be UTF-8 encoded text that can be turned into a `String`.

<a name="module_Http.expectJson"></a>

### Http.expectJson()
Expect the response body to be JSON. Like if you want to get a random cat
GIF you might say:
```ts
    import Http
    import Json.Decode exposing (Decoder, field, string)
    type Msg
      = GotGif (Result Http.Error String)
    getRandomCatGif : Cmd Msg
    getRandomCatGif =
      Http.get
        { url = "https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cat"
        , expect = Http.expectJson GotGif gifDecoder
        }
    gifDecoder : Decoder String
    gifDecoder =
      field "data" (field "image_url" string)
```
The official guide goes through this particular example [here][]. That page
also introduces [`elm/json`][json] to help you get started turning JSON into
Elm values in other situations.
[here]: https://guide.elm-lang.org/interop/json.html
[json]: /packages/elm/json/latest/
If the JSON decoder fails, you get a `BadBody` error that tries to explain
what went wrong.

<a name="module_Http.expectBytes"></a>

### Http.expectBytes()
Expect the response body to be binary data. For example, maybe you are
talking to an endpoint that gives back ProtoBuf data:
```ts
    import Bytes.Decode as Bytes
    import Http
    type Msg
      = GotData (Result Http.Error Data)
    getData : Cmd Msg
    getData =
      Http.get
        { url = "/data"
        , expect = Http.expectBytes GotData dataDecoder
        }
    -- dataDecoder : Bytes.Decoder Data
```
You would use [`elm/bytes`](/packages/elm/bytes/latest/) to decode the binary
data according to a proto definition file like `example.proto`.
If the decoder fails, you get a `BadBody` error that just indicates that
_something_ went wrong. It probably makes sense to debug by peeking at the
bytes you are getting in the browser developer tools or something.

<a name="module_Http.expectWhatever"></a>

### Http.expectWhatever()
Expect the response body to be whatever. It does not matter. Ignore it!
For example, you might want this when uploading files:
```ts
    import Http
    type Msg
      = Uploaded (Result Http.Error ())
    upload : File -> Cmd Msg
    upload file =
      Http.post
        { url = "/upload"
        , body = Http.fileBody file
        , expect = Http.expectWhatever Uploaded
        }
```
The server may be giving back a response body, but we do not care about it.

<a name="module_Http.expectStringResponse"></a>

### Http.expectStringResponse()
Expect a [`Response`](#Response) with a `String` body. So you could define
your own [`expectJson`](#expectJson) like this:
```ts
    import Http
    import Json.Decode as D
    expectJson : (Result Http.Error a -> msg) -> D.Decoder a -> Expect msg
    expectJson toMsg decoder =
      expectStringResponse toMsg <|
        \response ->
          case response of
            Http.BadUrl_ url ->
              Err (Http.BadUrl url)
            Http.Timeout_ ->
              Err Http.Timeout
            Http.NetworkError_ ->
              Err Http.NetworkError
            Http.BadStatus_ metadata body ->
              Err (Http.BadStatus metadata.statusCode)
            Http.GoodStatus_ metadata body ->
              case D.decodeString decoder body of
                Ok value ->
                  Ok value
                Err err ->
                  BadBody (D.errorToString err)
```
This function is great for fancier error handling and getting response headers.
For example, maybe when your sever gives a 404 status code (not found) it also
provides a helpful JSON message in the response body. This function lets you
add logic to the `BadStatus_` branch so you can parse that JSON and give users
a more helpful message! Or make your own custom error type for your particular
application!

<a name="module_Http.expectBytesResponse"></a>

### Http.expectBytesResponse()
Expect a [`Response`](#Response) with a `Bytes` body.
It works just like [`expectStringResponse`](#expectStringResponse), giving you
more access to headers and more leeway in defining your own errors.

<a name="module_Http.cancel"></a>

### Http.cancel()
Try to cancel an ongoing request based on a `tracker`.

<a name="module_Http.track"></a>

### Http.track()
Track the progress of a request. Create a [`request`](#request) where
`tracker = Just "form.pdf"` and you can track it with a subscription like
`track "form.pdf" GotProgress`.

<a name="module_Http.fractionSent"></a>

### Http.fractionSent()
Turn `Sending` progress into a useful fraction.
```ts
    fractionSent { sent =   0, size = 1024 } == 0.0
    fractionSent { sent = 256, size = 1024 } == 0.25
    fractionSent { sent = 512, size = 1024 } == 0.5
    -- fractionSent { sent = 0, size = 0 } == 1.0
```
The result is always between `0.0` and `1.0`, ensuring that any progress bar
animations never go out of bounds.
And notice that `size` can be zero. That means you are sending a request with
an empty body. Very common! When `size` is zero, the result is always `1.0`.
**Note:** If you create your own function to compute this fraction, watch out
for divide-by-zero errors!

<a name="module_Http.fractionReceived"></a>

### Http.fractionReceived()
Turn `Receiving` progress into a useful fraction for progress bars.
```ts
    fractionReceived { received =   0, size = Just 1024 } == 0.0
    fractionReceived { received = 256, size = Just 1024 } == 0.25
    fractionReceived { received = 512, size = Just 1024 } == 0.5
    -- fractionReceived { received =   0, size = Nothing } == 0.0
    -- fractionReceived { received = 256, size = Nothing } == 0.0
    -- fractionReceived { received = 512, size = Nothing } == 0.0
```
The `size` here is based on the [`Content-Length`][cl] header which may be
missing in some cases. A server may be misconfigured or it may be streaming
data and not actually know the final size. Whatever the case, this function
will always give `0.0` when the final size is unknown.
Furthermore, the `Content-Length` header may be incorrect! The implementation
clamps the fraction between `0.0` and `1.0`, so you will just get `1.0` if
you ever receive more bytes than promised.
**Note:** If you are streaming something, you can write a custom version of
this function that just tracks bytes received. Maybe you show that 22kb or 83kb
have been downloaded, without a specific fraction. If you do this, be wary of
divide-by-zero errors because `size` can always be zero!
[cl]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length

<a name="module_Result"></a>

## Result
<a name="module_Result.mapError"></a>

### Result.mapError()
Transform an `Err` value. For example, say the errors we get have too much
information:
    parseInt : String -> Result ParseError Int
    type alias ParseError =
        { message : String
        , code : Int
        , position : (Int,Int)
        }
    mapError .message (parseInt "123") == Ok 123
    mapError .message (parseInt "abc") == Err "char 'a' is not a number"

