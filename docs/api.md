## Functions

<dl>
<dt><a href="#get">get()</a></dt>
<dd><p>Create a <code>GET</code> request.
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = &quot;<a href="https://elm-lang.org/assets/public-opinion.txt&quot;">https://elm-lang.org/assets/public-opinion.txt&quot;</a>
        , expect = Http.expectString GotText
        }
You can use functions like <a href="#expectString"><code>expectString</code></a> and
<a href="#expectJson"><code>expectJson</code></a> to interpret the response in different ways. In
this example, we are expecting the response body to be a <code>String</code> containing
the full text of <em>Public Opinion</em> by Walter Lippmann.
<strong>Note:</strong> Use <a href="/packages/elm/url/latest"><code>elm/url</code></a> to build reliable URLs.</p>
</dd>
<dt><a href="#post">post()</a></dt>
<dd><p>Create a <code>POST</code> request. So imagine we want to send a POST request for
some JSON data. It might look like this:
    import Http
    import Json.Decode exposing (list, string)
    type Msg
      = GotBooks (Result Http.Error (List String))
    postBooks : Cmd Msg
    postBooks =
      Http.post
        { url = &quot;<a href="https://example.com/books&quot;">https://example.com/books&quot;</a>
        , body = Http.emptyBody
        , expect = Http.expectJson GotBooks (list string)
        }
Notice that we are using <a href="#expectJson"><code>expectJson</code></a> to interpret the response
as JSON. You can learn more about how JSON decoders work [here][] in the guide.
We did not put anything in the body of our request, but you can use functions
like <a href="#stringBody"><code>stringBody</code></a> and <a href="#jsonBody"><code>jsonBody</code></a> if you need to
send information to the server.
[here]: <a href="https://guide.elm-lang.org/interop/json.html">https://guide.elm-lang.org/interop/json.html</a></p>
</dd>
<dt><a href="#request">request()</a></dt>
<dd><p>Create a custom request. For example, a PUT for files might look like this:
  import File
  import Http
  type Msg = Uploaded (Result Http.Error ())
  upload : File.File -&gt; Cmd Msg
  upload file =
    Http.request
      { method = &quot;PUT&quot;
      , headers = []
      , url = &quot;<a href="https://example.com/publish&quot;">https://example.com/publish&quot;</a>
      , body = Http.fileBody file
      , expect = Http.expectWhatever Uploaded
      , timeout = Nothing
      , tracker = Nothing
      }
It lets you set custom <code>headers</code> as needed. The <code>timeout</code> is the number of
milliseconds you are willing to wait before giving up. The <code>tracker</code> lets you
<a href="#cancel"><code>cancel</code></a> and <a href="#track"><code>track</code></a> requests.</p>
</dd>
<dt><a href="#header">header()</a></dt>
<dd><p>Create a <code>Header</code>.
  header &quot;If-Modified-Since&quot; &quot;Sat 29 Oct 1994 19:43:31 GMT&quot;
  header &quot;Max-Forwards&quot; &quot;10&quot;
  header &quot;X-Requested-With&quot; &quot;XMLHttpRequest&quot;</p>
</dd>
<dt><a href="#emptyBody">emptyBody()</a></dt>
<dd><p>Create an empty body for your <code>Request</code>. This is useful for GET requests
and POST requests where you are not sending any data.</p>
</dd>
<dt><a href="#jsonBody">jsonBody()</a></dt>
<dd><p>Put some JSON value in the body of your <code>Request</code>. This will automatically
add the <code>Content-Type: application/json</code> header.</p>
</dd>
<dt><a href="#stringBody">stringBody()</a></dt>
<dd><p>Put some string in the body of your <code>Request</code>. Defining <code>jsonBody</code> looks
like this:
    import Json.Encode as Encode
    jsonBody : Encode.Value -&gt; Body
    jsonBody value =
      stringBody &quot;application/json&quot; (Encode.encode 0 value)
The first argument is a <a href="https://en.wikipedia.org/wiki/Media_type">MIME type</a>
of the body. Some servers are strict about this!</p>
</dd>
<dt><a href="#bytesBody">bytesBody()</a></dt>
<dd><p>Put some <code>Bytes</code> in the body of your <code>Request</code>. This allows you to use
<a href="/packages/elm/bytes/latest"><code>elm/bytes</code></a> to have full control over the binary
representation of the data you are sending. For example, you could create an
<code>archive.zip</code> file and send it along like this:
    import Bytes exposing (Bytes)
    zipBody : Bytes -&gt; Body
    zipBody bytes =
      bytesBody &quot;application/zip&quot; bytes
The first argument is a <a href="https://en.wikipedia.org/wiki/Media_type">MIME type</a>
of the body. In other scenarios you may want to use MIME types like <code>image/png</code>
or <code>image/jpeg</code> instead.
<strong>Note:</strong> Use <a href="#track"><code>track</code></a> to track upload progress.</p>
</dd>
<dt><a href="#fileBody">fileBody()</a></dt>
<dd><p>Use a file as the body of your <code>Request</code>. When someone uploads an image
into the browser with <a href="/packages/elm/file/latest"><code>elm/file</code></a> you can forward
it to a server.
This will automatically set the <code>Content-Type</code> to the MIME type of the file.
<strong>Note:</strong> Use <a href="#track"><code>track</code></a> to track upload progress.</p>
</dd>
<dt><a href="#expectString">expectString()</a></dt>
<dd><p>Expect the response body to be a <code>String</code>. Like when getting the full text
of a book:
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = &quot;<a href="https://elm-lang.org/assets/public-opinion.txt&quot;">https://elm-lang.org/assets/public-opinion.txt&quot;</a>
        , expect = Http.expectString GotText
        }
The response body is always some sequence of bytes, but in this case, we
expect it to be UTF-8 encoded text that can be turned into a <code>String</code>.</p>
</dd>
<dt><a href="#expectWhatever">expectWhatever()</a></dt>
<dd><p>Expect the response body to be whatever. It does not matter. Ignore it!
For example, you might want this when uploading files:
    import Http
    type Msg
      = Uploaded (Result Http.Error ())
    upload : File -&gt; Cmd Msg
    upload file =
      Http.post
        { url = &quot;/upload&quot;
        , body = Http.fileBody file
        , expect = Http.expectWhatever Uploaded
        }
The server may be giving back a response body, but we do not care about it.</p>
</dd>
<dt><a href="#expectStringResponse">expectStringResponse()</a></dt>
<dd><p>Expect a <a href="#Response"><code>Response</code></a> with a <code>String</code> body. So you could define
your own <a href="#expectJson"><code>expectJson</code></a> like this:
    import Http
    import Json.Decode as D
    expectJson : (Result Http.Error a -&gt; msg) -&gt; D.Decoder a -&gt; Expect msg
    expectJson toMsg decoder =
      expectStringResponse toMsg &lt;|
        \response -&gt;
          case response of
            Http.BadUrl_ url -&gt;
              Err (Http.BadUrl url)
            Http.Timeout_ -&gt;
              Err Http.Timeout
            Http.NetworkError_ -&gt;
              Err Http.NetworkError
            Http.BadStatus_ metadata body -&gt;
              Err (Http.BadStatus metadata.statusCode)
            Http.GoodStatus_ metadata body -&gt;
              case D.decodeString decoder body of
                Ok value -&gt;
                  Ok value
                Err err -&gt;
                  BadBody (D.errorToString err)
This function is great for fancier error handling and getting response headers.
For example, maybe when your sever gives a 404 status code (not found) it also
provides a helpful JSON message in the response body. This function lets you
add logic to the <code>BadStatus_</code> branch so you can parse that JSON and give users
a more helpful message! Or make your own custom error type for your particular
application!</p>
</dd>
<dt><a href="#expectBytesResponse">expectBytesResponse()</a></dt>
<dd><p>Expect a <a href="#Response"><code>Response</code></a> with a <code>Bytes</code> body.
It works just like <a href="#expectStringResponse"><code>expectStringResponse</code></a>, giving you
more access to headers and more leeway in defining your own errors.</p>
</dd>
<dt><a href="#mapError">mapError()</a></dt>
<dd><p>Transform an <code>Err</code> value. For example, say the errors we get have too much
information:
    parseInt : String -&gt; Result ParseError Int
    type alias ParseError =
        { message : String
        , code : Int
        , position : (Int,Int)
        }
    mapError .message (parseInt &quot;123&quot;) == Ok 123
    mapError .message (parseInt &quot;abc&quot;) == Err &quot;char &#39;a&#39; is not a number&quot;</p>
</dd>
</dl>

<a name="get"></a>

## get()
Create a `GET` request.
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = "https://elm-lang.org/assets/public-opinion.txt"
        , expect = Http.expectString GotText
        }
You can use functions like [`expectString`](#expectString) and
[`expectJson`](#expectJson) to interpret the response in different ways. In
this example, we are expecting the response body to be a `String` containing
the full text of _Public Opinion_ by Walter Lippmann.
**Note:** Use [`elm/url`](/packages/elm/url/latest) to build reliable URLs.

<a name="post"></a>

## post()
Create a `POST` request. So imagine we want to send a POST request for
some JSON data. It might look like this:
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
Notice that we are using [`expectJson`](#expectJson) to interpret the response
as JSON. You can learn more about how JSON decoders work [here][] in the guide.
We did not put anything in the body of our request, but you can use functions
like [`stringBody`](#stringBody) and [`jsonBody`](#jsonBody) if you need to
send information to the server.
[here]: https://guide.elm-lang.org/interop/json.html

<a name="request"></a>

## request()
Create a custom request. For example, a PUT for files might look like this:
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
It lets you set custom `headers` as needed. The `timeout` is the number of
milliseconds you are willing to wait before giving up. The `tracker` lets you
[`cancel`](#cancel) and [`track`](#track) requests.

<a name="header"></a>

## header()
Create a `Header`.
  header "If-Modified-Since" "Sat 29 Oct 1994 19:43:31 GMT"
  header "Max-Forwards" "10"
  header "X-Requested-With" "XMLHttpRequest"

<a name="emptyBody"></a>

## emptyBody()
Create an empty body for your `Request`. This is useful for GET requests
and POST requests where you are not sending any data.

<a name="jsonBody"></a>

## jsonBody()
Put some JSON value in the body of your `Request`. This will automatically
add the `Content-Type: application/json` header.

<a name="stringBody"></a>

## stringBody()
Put some string in the body of your `Request`. Defining `jsonBody` looks
like this:
    import Json.Encode as Encode
    jsonBody : Encode.Value -> Body
    jsonBody value =
      stringBody "application/json" (Encode.encode 0 value)
The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
of the body. Some servers are strict about this!

<a name="bytesBody"></a>

## bytesBody()
Put some `Bytes` in the body of your `Request`. This allows you to use
[`elm/bytes`](/packages/elm/bytes/latest) to have full control over the binary
representation of the data you are sending. For example, you could create an
`archive.zip` file and send it along like this:
    import Bytes exposing (Bytes)
    zipBody : Bytes -> Body
    zipBody bytes =
      bytesBody "application/zip" bytes
The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
of the body. In other scenarios you may want to use MIME types like `image/png`
or `image/jpeg` instead.
**Note:** Use [`track`](#track) to track upload progress.

<a name="fileBody"></a>

## fileBody()
Use a file as the body of your `Request`. When someone uploads an image
into the browser with [`elm/file`](/packages/elm/file/latest) you can forward
it to a server.
This will automatically set the `Content-Type` to the MIME type of the file.
**Note:** Use [`track`](#track) to track upload progress.

<a name="expectString"></a>

## expectString()
Expect the response body to be a `String`. Like when getting the full text
of a book:
    import Http
    type Msg
      = GotText (Result Http.Error String)
    getPublicOpinion : Cmd Msg
    getPublicOpinion =
      Http.get
        { url = "https://elm-lang.org/assets/public-opinion.txt"
        , expect = Http.expectString GotText
        }
The response body is always some sequence of bytes, but in this case, we
expect it to be UTF-8 encoded text that can be turned into a `String`.

<a name="expectWhatever"></a>

## expectWhatever()
Expect the response body to be whatever. It does not matter. Ignore it!
For example, you might want this when uploading files:
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
The server may be giving back a response body, but we do not care about it.

<a name="expectStringResponse"></a>

## expectStringResponse()
Expect a [`Response`](#Response) with a `String` body. So you could define
your own [`expectJson`](#expectJson) like this:
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
This function is great for fancier error handling and getting response headers.
For example, maybe when your sever gives a 404 status code (not found) it also
provides a helpful JSON message in the response body. This function lets you
add logic to the `BadStatus_` branch so you can parse that JSON and give users
a more helpful message! Or make your own custom error type for your particular
application!

<a name="expectBytesResponse"></a>

## expectBytesResponse()
Expect a [`Response`](#Response) with a `Bytes` body.
It works just like [`expectStringResponse`](#expectStringResponse), giving you
more access to headers and more leeway in defining your own errors.

<a name="mapError"></a>

## mapError()
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

