import * as Discord from "discord.js";
import * as Fs from "fs/promises";
import { default as Yargs } from "yargs";
import { hideBin } from "yargs/helpers";

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
    const canonicalResult = result
      .toLowerCase()
      .replaceAll(
        new RegExp(isEmoji.source, "gu"),
        (match) => canonical.get(match) ?? "",
      );
    if (isCanonical.test(canonicalResult)) {
      return canonicalResult;
    } else {
      throw new Error(
        `Could not canonicalize “${result}” (got “${canonicalResult}”).`,
      );
    }
  }
}

function* batches(items, batchSize = 10) {
  const copy = [...items];
  while (copy.length) {
    yield copy.splice(0, batchSize);
  }
}

async function batched(items, operation, batchSize = 10) {
  const results = [];
  for (const batch of batches(items, batchSize)) {
    results.push(await Promise.all(batch.map(operation)));
  }
  return results.flatMap((batch) => batch);
}

async function updateUser(client, old) {
  try {
    if (old.userId === undefined || old.userId === "") {
      console.error("Skipped user without userId.");
      return old;
    }
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

const isAddition = (user) => !Object.hasOwn(user, "name");

async function main(
  token = process.env.DISCORD_TOKEN,
  inputFile = "../data/jads-results.json",
  outputFile = "../data/jads-results.json",
  addOnly = false,
) {
  const inputData = await Fs.readFile(
    inputFile !== "--" ? inputFile : "/dev/stdin",
    "utf8",
  );
  const results = JSON.parse(inputData);

  const byUser = new Map();
  for (const result of results) {
    const existing = byUser.get(result.userId);
    if (existing) {
      console.warn(`Duplicated user: ${result.userId}.`);
    } else {
      byUser.set(result.userId, result);
    }
  }

  const client = new Discord.Client({ intents: 0 });
  await client.login(token);

  const update = addOnly
    ? (old) => (isAddition(old) ? updateUser(client, old) : old)
    : (old) => updateUser(client, old);

  const updatedResults = await batched(results, update, 10);

  client.destroy();

  const outputData = `${JSON.stringify(updatedResults, undefined, 2)}\n`;
  if (outputFile !== "--") {
    await Fs.writeFile(outputFile, outputData, { encoding: "utf8" });
  } else {
    process.stdout.write(outputData, "utf8");
  }
}

const args = Yargs(hideBin(process.argv))
  .option("add-only", {
    alias: "a",
    type: "boolean",
    description: "Only add new users",
    default: false,
  })
  .option("input-file", {
    alias: "f",
    type: "string",
    describe: "The file to read from.",
    default: "../data/jads-results.json",
  })
  .option("output-file", {
    alias: "o",
    type: "string",
    describe: "The file to write to.",
    default: "../data/jads-results.json",
  })
  .option("token", {
    alias: "t",
    type: "string",
    describe: "The Discord token to use",
    default: process.env.DISCORD_TOKEN,
  })
  .help("help")
  .alias("h", "help")
  .version(false)
  .parse();

await main(args.token, args.inputFile, args.outputFile, args.addOnly);
