import { deferBlock, Deferrable } from "./deferrable.ts";

import {
  Action,
  InferAllActions,
  MaybeEvaluate,
  Query,
  TupLike,
} from "./lib.types.ts";

type Source<T> = { client: T; initialized: true } | { initialized: false };

export class Resource<T, I extends unknown[] = [], D extends unknown[] = []> {
  protected source: Source<T> = { initialized: false };

  protected readonly struct: Deferrable<T, I, D>;

  constructor(params: Deferrable<T, I, D>);
  constructor(params: () => Deferrable<T, I, D>);
  constructor(
    params: MaybeEvaluate<Deferrable<T, I, D> & ThisType<Deferrable<T, I, D>>>
  ) {
    this.struct = typeof params === "function" ? params() : params;
  }

  init = async (...params: I) => {
    if (this.source.initialized) {
      throw new Error(
        "init() was called on a resource that was already initialized!"
      );
    }

    const client = await this.struct.init(...params);

    this.source = {
      initialized: true,
      client,
    };

    return client;
  };

  deInit = async (...params: D) => {
    if (!this.source.initialized) {
      throw new Error("deInit() was called on an uninitialized resource!");
    }
    await this.struct.deInit(this.source.client, ...params);

    this.source = { initialized: false };
  };

  dupe = () => new Resource(this.struct);

  query(params: { init: I; deInit: D }) {
    const { init, deInit } = this;

    const q: Query<T> = async (action) => {
      const res = await deferBlock(async ({ defer }) => {
        const client = await defer({
          async init() {
            return await init(...params.init);
          },
          async deInit() {
            return await deInit(...params.deInit);
          },
        });

        this.source = { initialized: true, client };

        return await action(client);
      });

      return res;
    };

    q.all = async <U extends TupLike<Action<T, unknown>>>(actions: U) => {
      return await q(async (client) => {
        return (await Promise.all(
          actions.map(async (action) => await action(client))
        )) as InferAllActions<U, "all">;
      });
    };

    q.allSettled = async <U extends TupLike<Action<T, unknown>>>(
      actions: U
    ) => {
      return await q(async (client) => {
        return (await Promise.allSettled(
          actions.map(async (action) => await action(client))
        )) as InferAllActions<U, "settled">;
      });
    };

    return q;
  }

  middleware<S, U extends unknown[] = [], V extends unknown[] = []>(mw: {
    init: Action<T, S, U>;
    deInit: Action<S, void, V>;
  }) {
    const { init, deInit } = this;

    return new Resource({
      async init(...params: [I, U]) {
        return await mw.init(await init(...params[0]), ...params[1]);
      },
      async deInit(Re, ...params: [D, V]) {
        await mw.deInit(Re, ...params[1]);
        await deInit(...params[0]);
      },
    });
  }
}

Deno.test({
  name: "creating a resource",
  async fn() {
    const memes = new Resource({
      init(name: string) {
        console.log(`Hello ${name}!`);
        return { name };
      },
      deInit({ name }, farewell: string) {
        console.log(`Goodbye ${name}! ` + farewell);
      },
    });

    const res = await memes
      .query({ init: ["Jenny"], deInit: ["See you soon!"] })
      .all([({ name }) => name]);

    console.log(res);
  },
});
