import { html, render } from "https://unpkg.com/lit@2.2.3?module";

import { load, randomBool, shuffle, zip } from "./util.mjs";
import { computeResults, renderResults } from "./results.mjs";

function expand(answers) {
  switch (answers.length) {
    case 2: {
      const [l, r] = answers;
      return [l, undefined, undefined, undefined, r];
    }
    case 3: {
      const [l, c, r] = answers;
      return [l, undefined, c, undefined, r];
    }
    case 5:
      return answers;
    default:
      throw new Error("Invalid answers length.");
  }
}

function loadQuestion({ question, answers, effects }) {
  const answersWithEffects = zip(expand(answers), effects).map(
    ([answer, effect]) => ({
      answer,
      effect,
    }),
  );
  if (randomBool()) {
    answersWithEffects.reverse();
  }
  return {
    question,
    answers: answersWithEffects,
  };
}

const questions = shuffle(await load("./data/questions.json")).map(
  loadQuestion,
);

const chosenAnswers = new Map();

const choose = (questionIndex, answerIndex) => {
  chosenAnswers.set(questionIndex, answerIndex);
  renderQuestion(questionIndex);
};

const renderLabel = (questionIndex, answerIndex, { answer }) =>
  answer !== undefined
    ? html`
        <li @click=${() => choose(questionIndex, answerIndex)}>${answer}</li>
      `
    : html``;

function renderQuestion(questionIndex) {
  const test = document.getElementById("test");

  const { question, answers } = questions[questionIndex];

  const existingAnswer = chosenAnswers.get(questionIndex);
  const currentAnswer = existingAnswer ?? 2;
  if (existingAnswer === undefined) {
    chosenAnswers.set(questionIndex, currentAnswer);
  }

  const view = html`
    <h2>The Test</h2>

    <div class="progress">
      <button
        @click="${() => renderQuestion(questionIndex - 1)}"
        ?disabled="${questionIndex - 1 < 0}"
      >
        Previous
      </button>
      <label>
        <span>${questionIndex + 1} / ${questions.length}</span>
        <progress
          value="${questionIndex}"
          max="${questions.length - 1}"
        ></progress>
      </label>
      <button
        @click="${() => renderQuestion(questionIndex + 1)}"
        ?disabled="${questionIndex + 1 >= questions.length}"
      >
        Next
      </button>
    </div>

    <form id="question-${questionIndex}">
      <h3>Question ${questionIndex + 1}:</h3>
      <p class="question">${question}</p>
      <div class="answers">
        <ol class="labels">
          ${answers.map((answer, index) =>
            renderLabel(questionIndex, index, answer),
          )}
        </ol>
        <input
          id="q${questionIndex}"
          class="controls"
          type="range"
          min="0"
          max="4"
          step="1"
          .value=${currentAnswer}
          @change="${({ target }) => choose(questionIndex, target.value)}"
        />
      </div>
    </form>

    ${questionIndex + 1 >= questions.length
      ? html`
          <button
            class="finish"
            @click="${() =>
              renderResults(computeResults(questions, chosenAnswers))}"
          >
            Get Your JADSotype
          </button>
        `
      : html``}
  `;

  render(view, test);
}

export function init() {
  if (window.location.hash !== "") {
    renderResults(window.location.hash);
  } else {
    renderQuestion(0);
  }
}
