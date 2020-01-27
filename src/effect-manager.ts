import { EffectManager, Dispatch, LeafEffect } from "@typescript-tea/core";

const home = "http";

type State = {};
type SelfAction = { readonly type: "Action1" } | { readonly type: "Action2" };

export const createEffectManager = <AppAction>(): EffectManager<
  AppAction,
  SelfAction,
  State,
  typeof home
> => ({
  home,
  mapCmd: (_, c) => c,
  mapSub: (_, s) => s,
  onEffects,
  onSelfAction
});

// function mapCmd() {}

// function mapSub() {}

function onEffects<AppAction>(
  _dispatchApp: Dispatch<AppAction>,
  _dispatchSelf: Dispatch<SelfAction>,
  _cmds: ReadonlyArray<LeafEffect<AppAction>>,
  _subs: ReadonlyArray<LeafEffect<AppAction>>,
  state: State
): State {
  return state;
}

function onSelfAction<AppAction>(
  _dispatchApp: Dispatch<AppAction>,
  _dispatchSelf: Dispatch<SelfAction>,
  _action: SelfAction,
  state: State
): State {
  return state;
}
