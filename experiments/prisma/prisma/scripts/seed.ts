import { Pr, data } from "./core.ts";

const Q = Pr.query({ init: [], deInit: [] });

const res = await Q.all(
  data.map(({ name }, id) => async (Cl) => {
    const value = { id, name };

    return await Cl.user.upsert({
      create: value,
      update: { name },
      where: { id },
    });
  })
);

console.log(res);
