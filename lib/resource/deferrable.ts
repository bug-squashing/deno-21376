// deno-lint-ignore-file no-explicit-any no-namespace
import { Action, Potential, PotentialFunction } from "./lib.types.ts";

export namespace Deferrable {
  export interface Zig<T, U extends unknown[] = [], V extends unknown[] = []> {
    init: PotentialFunction<
      { resource: T; deInit: PotentialFunction<void, V> },
      U
    >;
  }

  export interface Interface<
    T,
    U extends unknown[] = [],
    V extends unknown[] = []
  > {
    init: PotentialFunction<T, U>;
    deInit: Action<T, void, V>;
  }

  export interface Resource<
    T,
    U extends unknown[] = [],
    V extends unknown[] = []
  > {
    init: PotentialFunction<T, U>;
    deInit: PotentialFunction<void, V>;
  }
}

export type Deferrable<
  T,
  U extends unknown[] = [],
  V extends unknown[] = []
> = Deferrable.Interface<T, U, V>;

export type DeferPrams<T extends Deferrable<unknown, unknown[], unknown[]>> =
  T extends Deferrable<any, infer I, infer D>
    ? {
        init: I;
        deInit: D;
      }
    : never;

interface Defer {
  <U>(def: Deferrable<U>): Potential<U>;
  (def: PotentialFunction<void>): void;
}

export async function deferBlock<T>(
  block: (keywords: { defer: Defer }) => Potential<T>
) {
  const deferredTasks: PotentialFunction<void>[] = [];

  const defer: Defer = async <U>(
    def: Deferrable<U> | PotentialFunction<void>
  ) => {
    if (typeof def === "function") {
      deferredTasks.push(def);
      return;
    }

    const client = await def.init();
    deferredTasks.push(async () => await def.deInit(client));
    return client;
  };

  const res = await block({ defer });

  for (const cleanup of deferredTasks.reverse()) {
    await cleanup();
  }

  return res;
}

export function voidDeferrable<
  T,
  U extends unknown[] = [],
  V extends unknown[] = []
>(def: Deferrable<T, U, V>) {
  return (...initParams: U) =>
    (...deInitParams: V) => {
      const res: Deferrable<T> = {
        async init() {
          return await def.init(...initParams);
        },
        async deInit(Cl) {
          return await def.deInit(Cl, ...deInitParams);
        },
      };

      return res;
    };
}
