import { html, render } from "https://unpkg.com/lit@2.2.3?module";

import { load, modulo, product } from "./util.mjs";

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
      const oldUsername = discriminator !== undefined;
      const avatarUrl =
        avatar !== undefined
          ? `avatars/${userId}/${avatar}.webp`
          : `embed/avatars/${
              oldUsername
                ? modulo(parseInt(discriminator, 10), 5)
                : modulo(userId >> 22, 6)
            }.png`;
      const username = oldUsername
        ? html`<p>
            <span class="name">${name}</span
            ><span class="discriminator">#${discriminator}</span>
          </p>`
        : html`<p>
            <span class="name">${name}</span>
          </p>`;
      const usernameText = oldUsername ? `${name}#${discriminator}` : name;
      return html`
        <li>
          <img
            alt="${name}'s Avatar"
            title="${usernameText}"
            src="https://cdn.discordapp.com/${avatarUrl}"
          />
          ${username}
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
        <h2>
          ${result.map(
            ({ name, emoji }) => html`<span title=${name}>${emoji} </span>`,
          )}
        </h2>
        <ul>
          ${users.map(user)}
        </ul>
      </div>
    `;
  };

  const resultRoot = document.getElementById("jads-results");

  const namesToggled = (target) => {
    if (target.checked) {
      resultRoot.classList.add("names");
    } else {
      resultRoot.classList.remove("names");
    }
  };
  const namesToggle = document.getElementById("names");
  namesToggle.addEventListener("click", ({ target }) => namesToggled(target));
  namesToggled(namesToggle);

  render(
    html`<div>
      ${product(...dichotomies.map(({ ends }) => ends)).map(gridCell)}
    </div>`,
    resultRoot,
  );
}
