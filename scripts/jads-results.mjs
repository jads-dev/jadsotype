import { html, render } from "https://unpkg.com/lit@2.2.3?module";

import { load, product } from "./util.mjs";

export async function init() {
  const [results, dichotomies] = await Promise.all([
    load("./data/jads-results.json"),
    load("./data/dichotomies.json"),
  ]);

  const usersByResult = new Map();
  for (const user of results) {
    usersByResult.set(
      user.result,
      (usersByResult.get(user.result) ?? []).concat(user),
    );
  }

  const user = ({ name, discriminator, avatar, userId }) => {
    if (name !== undefined) {
      const avatarUrl =
        avatar !== undefined
          ? `avatars/${userId}/${avatar}.webp`
          : `embed/avatars/${parseInt(discriminator, 10) % 5}.png`;
      return html`
        <li>
          <img
            alt="${name}'s Avatar"
            title="${name}#${discriminator}"
            src="https://cdn.discordapp.com/${avatarUrl}"
          />
        </li>
      `;
    } else {
      return html``;
    }
  };

  const gridCell = (result) => {
    const users = usersByResult.get(result.map(({ id }) => id).join("")) ?? [];
    return html`
      <div class="result">
        <h2>${result.map(({ emoji }) => emoji).join(" ")}</h2>
        <ul>
          ${users.map(user)}
        </ul>
      </div>
    `;
  };

  render(
    product(...dichotomies.map(({ ends }) => ends)).map(gridCell),
    document.getElementById("jads-results"),
  );
}
