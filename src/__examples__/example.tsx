import React from "react";
import ReactDOM from "react-dom";
import { exhaustiveCheck } from "ts-exhaustive-check";
import { Cmd, Program, Dispatch } from "@typescript-tea/core";
import { reactRuntime } from "@typescript-tea/react-runtime";
import * as Http from "../effect-manager";
import { Result, Ok, Err } from "../result";

// -- Press a button to send a GET request for random cat GIFs.

// -- STATE

type State =
  | { readonly type: "Failure" }
  | { readonly type: "Loading" }
  | { readonly type: "Success"; readonly url: string };

const init = (): readonly [State, Cmd<Action>] => [{ type: "Loading" }, getRandomCatGif()];

// -- UPDATE

type Action =
  | { readonly type: "MorePlease" }
  | { readonly type: "GotGif"; readonly result: Result<Http.Error, string> };

function update(action: Action, _state: State): readonly [State, Cmd<Action>?] {
  switch (action.type) {
    case "MorePlease":
      return [{ type: "Loading" }, getRandomCatGif()];
    case "GotGif":
      console.log("action", action);
      switch (action.result.type) {
        case "Ok":
          return [{ type: "Success", url: action.result.value }, undefined];
        case "Err":
          return [{ type: "Failure" }, undefined];
        default:
          return exhaustiveCheck(action.result, true);
      }
    default:
      return exhaustiveCheck(action, true);
  }
}

// -- VIEW

function view({ dispatch, state }: { readonly dispatch: Dispatch<Action>; readonly state: State }): JSX.Element {
  return (
    <div>
      <h2>Random Cats</h2>
      {viewGif(dispatch, state)}
    </div>
  );
}

function viewGif(dispatch: Dispatch<Action>, state: State): JSX.Element {
  switch (state.type) {
    case "Failure":
      return (
        <div>
          I could not load a random cat for some reason.
          <button onClick={() => dispatch({ type: "MorePlease" })}>Try Again!</button>
        </div>
      );

    case "Loading":
      return <span>Loading...</span>;
    case "Success":
      return (
        <div>
          <button onClick={() => dispatch({ type: "MorePlease" })} style={{ display: "block" }}>
            More Please!
          </button>
          <img src={state.url} />
        </div>
      );
    default:
      return exhaustiveCheck(state);
  }
}

// -- HTTP

function getRandomCatGif(): Cmd<Action> {
  return Http.get(
    "https://api.giphy.com/v1/gifs/random?api_key=fynIjQH0KtzG1JeEkZZGT3cTie9KFm1T&tag=cat",
    // Http.expectString((result) => ({ type: "GotGif", result }))
    Http.expectJson((result) => ({ type: "GotGif", result }), gifDecoder)
  );
}

function gifDecoder(s: string): Result<string, Http.Json> {
  const parsed = JSON.parse(s);
  if (parsed.data?.image_url !== undefined) {
    return Ok(parsed.data.image_url);
  }
  return Err("Bad format");
}

/*
gifDecoder : Decoder String
gifDecoder =
  field "data" (field "image_url" string)
*/

// -- PROGRAM

const program: Program<State, Action, JSX.Element> = {
  init,
  update,
  view,
};

// -- RUNTIME

const Root = reactRuntime(program, [Http.createEffectManager()]);
const app = document.getElementById("app");
ReactDOM.render(<Root />, app);
