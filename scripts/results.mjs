import { Chart, registerables } from "https://unpkg.com/chart.js@3.7.1?module";
import { html, render } from "https://unpkg.com/lit@2.2.3?module";

import { load, max, randomBool } from "./util.mjs";

Chart.register(...registerables);

const dichotomies = await load("./data/dichotomies.json");

export function computeResults(questions, chosenAnswers) {
  const scores = new Map();

  for (const [questionIndex, answerIndex] of chosenAnswers.entries()) {
    const question = questions[questionIndex];
    const answer = question.answers[answerIndex];
    for (const end of answer.effect) {
      scores.set(end, (scores.get(end) ?? 0) + 1);
    }
  }

  const result = dichotomies
    .map(({ ends }) => {
      const [l, r] = ends;
      const [lScore, rScore] = [scores.get(l.id) ?? 0, scores.get(r.id) ?? 0];
      if (lScore > rScore) {
        return l.id;
      } else if (rScore > lScore) {
        return r.id;
      } else {
        return randomBool() ? l.id : r.id;
      }
    })
    .join("");

  const encodedScores = [...scores.entries()]
    .map(([id, score]) => `${id}:${score}`)
    .join(";");

  return `#${result}#${encodedScores}`;
}

let chart = undefined;

export function renderResults(hash) {
  const test = document.getElementById("test");

  const [_, result, encodedScores] = hash.split("#");
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }

  const results = dichotomies.map((d, index) => [
    d,
    result[index] === d.ends[0].id ? d.ends[0] : d.ends[1],
  ]);

  const scores = new Map(
    encodedScores
      .split(";")
      .map((s) => s.split(":"))
      .map(([id, score]) => [id, parseInt(score)]),
  );

  const primary = max([...scores.entries()], ([_, { score }]) => score).id;

  function renderEnd([d, { id, name, emoji, description }]) {
    return html`
      <li class="${d.id}">
        <h4>${emoji} ${name}</h4>
        <p>
          ${description}${primary === id
            ? html` <span class="primary">Primary Aspect</span>`
            : html``}
        </p>
      </li>
    `;
  }

  const emojiResult = results.map(([_, { emoji }]) => emoji).join(" ");
  const shareText = `My JADSotype is:\n${emojiResult}\n\nhttps://jads-dev.github.io/jadsotype`;
  const shareFunc = () => {
    navigator.clipboard.writeText(shareText).catch(() => {});
    document.getElementById("share").textContent = "✔ Copied";
  };

  render(
    html`
      <h2>Results</h2>

      <div class="result">
        <div class="simple">
          <span class="emoji">${emojiResult}</span>
          <button id="share" @click="${shareFunc}">➦ Share</button>
        </div>
        <ol class="full">
          ${results.map(renderEnd)}
        </ol>
        <p><a href="results.html" target="_blank">See how you compare.</a></p>
      </div>

      <h3>Detailed Results</h3>
      <canvas id="chart"></canvas>
    `,
    test,
  );

  const ends = [
    ...dichotomies.map((dichotomy) => ({ ...dichotomy.ends[0], dichotomy })),
    ...dichotomies.map((dichotomy) => ({ ...dichotomy.ends[1], dichotomy })),
  ];

  const colours = ends.map(({ dichotomy }) => dichotomy.colour);

  const emoji = ends.map(({ emoji }) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.font = "32px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(emoji, 32, 32);
    return canvas;
  });

  const winners = new Set(result);
  console.log(winners);

  if (chart !== undefined) {
    chart.destroy();
  }
  const ctx = document.getElementById("chart").getContext("2d");
  const chartOptions = {
    type: "radar",
    data: {
      labels: ends.map(({ name }) => name),
      datasets: [
        {
          data: ends.map(({ id }) => scores.get(id) ?? 0),
          backgroundColor: "rgba(255, 255, 255, 0.4)",
        },
      ],
    },
    options: {
      responsive: true,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false,
        },
      },
      elements: {
        point: {
          pointStyle: emoji,
          hitRadius: 25,
        },
      },
      scales: {
        r: {
          min: -1,
          ticks: {
            display: false,
          },
          pointLabels: {
            font: {
              size: 20,
              weight: ends.map(({ id }) =>
                winners.has(id) ? "bold" : "normal",
              ),
            },
            color: colours,
          },
          grid: {
            circular: true,
            lineWidth: 3,
          },
          angleLines: {
            color: colours,
          },
        },
      },
    },
  };
  chart = new Chart(ctx, chartOptions);
}
