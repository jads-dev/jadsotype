import * as Discord from "discord.js";
import * as Fs from "fs/promises";

const filename = "../data/jads-results.json";

const dichotomies = JSON.parse(
  await Fs.readFile("../data/dichotomies.json", "utf8"),
);

const canonical = new Map(
  dichotomies.flatMap(({ ends }) => ends).map((end) => [end.emoji, end.id]),
);
const isEmoji = new RegExp(
  `${dichotomies
    .flatMap(({ ends }) => ends)
    .map((end) => end.emoji)
    .join("|")}|\\s`,
  "u",
);
const isCanonical = new RegExp(
  `^${dichotomies
    .flatMap(({ ends }) => `[${ends[0].id}${ends[1].id}]`)
    .join("")}$`,
  "u",
);
function canonicalize(result) {
  if (isCanonical.test(result)) {
    return result;
  } else {
    return result
      .toLowerCase()
      .replaceAll(
        new RegExp(isEmoji.source, "gu"),
        (match) => canonical.get(match) ?? "",
      );
  }
}

const file = JSON.parse(await Fs.readFile(filename, "utf8"));

const client = new Discord.Client({ intents: 0 });
await client.login(process.env.DISCORD_TOKEN);

async function updateUser(old) {
  try {
    const { username, discriminator, avatar } = await client.users.fetch(
      old.userId,
    );
    return {
      ...old,
      name: username,
      discriminator,
      avatar: avatar ?? undefined,
      result: canonicalize(old.result),
    };
  } catch (e) {
    console.error(e);
    return old;
  }
}

await Fs.writeFile(
  filename,
  `${JSON.stringify(await Promise.all(file.map(updateUser)), undefined, 2)}\n`,
  { encoding: "utf8" },
);

await client.destroy();
