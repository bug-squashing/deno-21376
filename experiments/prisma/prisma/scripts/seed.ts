import { Pr, data } from "./core.ts";

const Q = Pr.query({ init: [], deInit: [] });

const res = await Q.all(
  data.map(({ name }, id) => async (Cl) => {
    const value = { id, name };

    return await Cl.user.upsert({
      create: value,
      update: value, // correct this by replacing with { name }
      where: value, // correct this by replacing with { id }
    });
  })
);

console.log(res);
