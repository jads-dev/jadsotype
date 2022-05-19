import * as Discord from "discord.js";
import * as Fs from "fs/promises";

const filename = "../data/jads-results.json";

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
    };
  } catch (e) {
    console.error(e);
    return old;
  }
}

await Fs.writeFile(
  filename,
  JSON.stringify(await Promise.all(file.map(updateUser)), undefined, 2),
  { encoding: "utf8" },
);

await client.destroy();
