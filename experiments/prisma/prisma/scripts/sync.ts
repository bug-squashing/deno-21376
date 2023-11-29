import { Pr, data } from "./core.ts";

const Q = Pr.query({ init: [], deInit: [] });

const deleteRes = await Q(async (Cl) => {
  return await Cl.user.deleteMany();
});

console.log(deleteRes);

const res = await Q.all(
  data.map(({ name }, id) => async (Cl) => {
    const value = { id, name };

    return await Cl.user.upsert({
      create: value,
      update: value,
      where: { id },
    });
  })
);

console.log(res);
