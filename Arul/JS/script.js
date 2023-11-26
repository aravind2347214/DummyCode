function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

class TriviaGameShow {
    constructor(element, options = {}) {
      console.log("Constructor called");
      // Which categories we should use (or use default if nothing provided)
      this.useCategoryIds = options.useCategoryIds || [randomNumber(1,20),randomNumber(21,40), randomNumber(41,60), randomNumber(61,80)];
      console.log(this.useCategoryIds);
  
      // Database
      this.categories = [];
      this.clues = {};
  
      // State
      this.currentClue = null;
      this.currentPlayer = 1;
      this.score = 0; // Initialize score
      this.players = {
        1: {
          score: 0,
          element: element.querySelector(".player-1-score"),
        },
        2: {
          score: 0,
          element: element.querySelector(".player-2-score"),
        },
      };

      console.log(this.players);
  
      // Elements
      this.boardElement = element.querySelector(".board");
      console.log(this.boardElement);
      this.scoreCountElement = element.querySelector(".score-count");
      this.formElement = element.querySelector("form");
      this.inputElement = element.querySelector("input[name=user-answer]");
      this.modalElement = element.querySelector(".card-modal");
      this.clueTextElement = element.querySelector(".clue-text");
      this.resultElement = element.querySelector(".result");
      this.resultTextElement = element.querySelector(
        ".result_correct-answer-text"
      );
      this.successTextElement = element.querySelector(".result_success");
      this.failTextElement = element.querySelector(".result_fail");
      this.playerTurnElement = element.querySelector(".player-turn");
      this.playerTurnElement.textContent =`Player ${this.currentPlayer}'s Turn`;
    }
  
    initGame() {
      // Bind event handlers
      console.log("Inigit game called");
      this.boardElement.addEventListener("click", (event) => {
        // console.log("board is clicked");
        if (event.target.dataset.clueId) {
          this.handleClueClick(event);
        }
      });
      this.formElement.addEventListener("submit", (event) => {
        this.handleFormSubmit(event);

      });
  
      // Render initial state of score
    //   this.updatePlayerScore(1,0);
    //   this.updatePlayerScore(2,0);

  
      // Kick off the category fetch
      console.log("vbefore calling fetch category");
      this.fetchCategories();
    }
  
    fetchCategories() {
    console.log("Fetch categories called");
      // Fetch all of the data from the API
      const categories = this.useCategoryIds.map((category_id) => {
        return new Promise((resolve, reject) => {
          fetch(`https://jservice.io/api/category?id=${category_id}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("DATATATA",data);
              resolve(data);
            });
        });
      });
  
      // Sift through the data when all categories come back
      Promise.all(categories).then((results) => {
        // Build up our list of categories
        results.forEach((result, categoryIndex) => {
          // Start with a blank category
          var category = {
            title: result.title,
            clues: [],
          };
  
          // Add every clue within a category to our database of clues
          var clues = shuffle(result.clues)
            .splice(0, 5)
            .forEach((clue, index) => {
              // Create unique ID for this clue
              var clueId = categoryIndex + "-" + index;
              category.clues.push(clueId);
  
              // Add clue to DB
              this.clues[clueId] = {
                question: clue.question,
                answer: clue.answer,
                value: (index + 1) * 100,
              };
            });
  
          // Add this category to our DB of categories
          this.categories.push(category);
        });
  
        // Render each category to the DOM
        this.categories.forEach((c) => {
          this.renderCategory(c);
        });
      });
    }
  
    renderCategory(category) {
      let column = document.createElement("div");
      column.classList.add("column");
      column.innerHTML = `<header>${category.title}</header>
           <ul>
           </ul>`.trim();
  
      var ul = column.querySelector("ul");
      category.clues.forEach((clueId) => {
        var clue = this.clues[clueId];
        ul.innerHTML += `<li><button data-clue-id=${clueId}>${clue.value}</button></li>`;
      });
  
      // Add to DOM
      this.boardElement.appendChild(column);
    }
  
    // updateScore(change) {
    //   console.log("score update called");
    //   this.score += change;
    //   this.scoreCountElement.textContent = this.score;
    //   console.log("score updated");
    // }
  
    handleClueClick(event) {
      var clue = this.clues[event.target.dataset.clueId];
  
      // Mark this button as used
      event.target.classList.add("used");
  
      // Clear out the input field
      this.inputElement.value = "";
  
      // Update current clue
      this.currentClue = clue;
  
      // Update the text
      this.clueTextElement.textContent = this.currentClue.question;
      this.resultTextElement.textContent = this.currentClue.answer;
  
      // Hide the result
      this.modalElement.classList.remove("showing-result");
  
      // Show the modal
      this.modalElement.classList.add("visible");
      this.inputElement.focus();
    }
  
    // Handle an answer from the user
    handleFormSubmit(event) {
      event.preventDefault();
  
      var isCorrect =
        this.cleanseAnswer(this.inputElement.value) ===
        this.cleanseAnswer(this.currentClue.answer);
  
      if (isCorrect) {
        this.updatePlayerScore(this.currentPlayer, this.currentClue.value);
      }
  
      // Show the answer
      this.revealAnswer(isCorrect);
  
      // Switch to the next player
      this.switchPlayer();
    }
  
    updatePlayerScore(player, change) {
      this.players[player].score += change;
      this.players[player].element.textContent = this.players[player].score;
    }
  
    switchPlayer() {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      this.playerTurnElement.textContent = `Player ${this.currentPlayer}'s Turn`;
    }
  
    // Standardize an answer string so we can compare and accept variations
    cleanseAnswer(input = "") {
      var friendlyAnswer = input.toLowerCase();
      friendlyAnswer = friendlyAnswer.replace("<i>", "");
      friendlyAnswer = friendlyAnswer.replace("</i>", "");
      friendlyAnswer = friendlyAnswer.replace(/ /g, "");
      friendlyAnswer = friendlyAnswer.replace(/"/g, "");
      friendlyAnswer = friendlyAnswer.replace(/^a /, "");
      friendlyAnswer = friendlyAnswer.replace(/^an /, "");
      return friendlyAnswer.trim();
    }
  
    revealAnswer(isCorrect) {
      this.successTextElement.style.display = isCorrect ? "block" : "none";
      this.failTextElement.style.display = !isCorrect ? "block" : "none";
  
      this.modalElement.classList.add("showing-result");
  
      setTimeout(() => {
        this.modalElement.classList.remove("visible");
      }, 3000);
    }
  }
  
  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }
  
  const game = new TriviaGameShow(document.querySelector(".app"), {});
  game.initGame();