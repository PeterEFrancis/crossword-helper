
const BLACK = 1;
const WHITE = 0;



var dictionary = [];
var length_dictionary = get_blank_array(100).map(x => []);
$.get("https://raw.githubusercontent.com/PeterEFrancis/crossword-helper/main/word-lists/broda.txt", function(txt) {
  var dict_words = txt.split("\n");
  for (var i = 0; i < dict_words.length; i++ ) {
    let word = dict_words[i].trim();
    dictionary.push(word);
    length_dictionary[word.length].push(word);
  }
});



function has_matches(str) {
  for (let word of length_dictionary[str.length]) {
    let regex = new RegExp("^" + str.replaceAll('-', '.') + "$");
    if (regex.test(word)) {
      return true;
    }
  }
  return false;
}


function get_matches(str) {
  let regstr = "^" + str.replaceAll('-', '.') + "$";
  let words = [];
  for (let word of dictionary) {
    let regex = new RegExp(regstr);
    if (regex.test(word)) {
      words.push(word);
    }
  }
  return words;
}









function get_blank_array(n) {
  let ret = [];
  for (let i = 0; i < n; i++) {
    ret.push(0);
  }
  return ret;
}


function copy(thing) {
  return JSON.parse(JSON.stringify(thing));
}








class XW {
  constructor(grid, bool) {
    this.grid = grid;
    this.N = grid.length ** (1/2);
    this.word_map = null;
    this.verified_words = [];
    if (bool) {
      this.init();
    }
  }

  init() {
    this.get_word_map();
    for (let i = 0; i < this.word_map.length; i++) {
      let word = this.get_word_from_locs(this.word_map[i]);
      this.verified_words[i] = !word.includes("-");
    }
  }

  copy() {
    let ret = new XW(this.grid);
    ret.grid = copy(this.grid);
    ret.N = this.N;
    ret.word_map = copy(this.word_map);
    ret.verified_words = copy(this.verified_words);
    return ret;
  }


  disp() {
    let ret = "";
    for (let i = 0; i < this.grid.length; i++) {
      ret += this.grid[i] + " ";
      if (i % N == N - 1) {
        ret += "\n";
      }
    }
    return ret.replaceAll('0',' ').replaceAll('1', '#').toUpperCase();
  }

  get_word_locs(pos, dr) {
    let ret = [];

    for (let i = 0; i < this.N; i++) {
      let x = pos % this.N;
      let y = Math.floor(pos / this.N);

      if ((dr == 1 && x == 0) || (dr == this.N && y == 0)) {
        break;
      }
      if (this.grid[pos - dr] == BLACK) {
        break;
      }
      pos -= dr;
    }

    while (true) {
      ret.push(pos);
      pos += dr;
      if (
        pos >= this.N ** 2 ||
        this.grid[pos] == BLACK ||
        (dr == 1 && pos % this.N == 0) ||
        (dr == this.N && Math.floor(pos / this.N) == this.N)
      ) {
        break;
      }
    }
    return ret;
  }

  get_word_from_locs(locs) {
    return locs.map(x => this.grid[x]).join("").replaceAll("0", "-");
  }

  get_word(pos, dr) {
    return this.get_word_locs(pos, dr)
      .map(x => this.grid[x])
      .join("")
      .replaceAll("0", "-");
  }


  get_numbers() {
    let ret = get_blank_array(this.N ** 2);
    let count = 1;
    for (let i = 0; i < this.N ** 2; i++) {
      if (this.grid[i] != BLACK) {
        let xl = this.get_word(i, 1).length;
        let yl = this.get_word(i, this.N).length;
        if (
          ((this.grid[i - 1] == BLACK || i % this.N == 0) && xl > 1) ||
          ((this.grid[i - this.N] == BLACK || Math.floor(i / this.N) == 0) && yl > 1)
        ){
          ret[i] = count;
          count++;
        }
      }
    }
    return ret;
  }


  get_word_map() {
    if (!this.word_map) {
      this.word_map = [];
      let nums = this.get_numbers();
      for (let i = 0; i < this.grid.length; i++) {
        if (nums[i] > 0) {
          for (let dr of [1, N]) {
            let word_locs = this.get_word_locs(i, dr);
            if (word_locs.length > 1) {
              let a = (dr == 1 && (i % N == 0 || this.grid[i - 1] == BLACK));
              let b = (dr == N && (Math.floor(i / N) == 0 || this.grid[i - N] == BLACK));
              if (a || b) {
                this.word_map.push(word_locs);
              }
            }
          }
        }
      }
    }
    return this.word_map;
  }


  get_children(this_word_id) {
    if (!this.word_map) {
      this.get_word_map();
    }

    let ret = [];

    let this_word = this.get_word_from_locs(this.word_map[this_word_id]);

    // this word was already filled
    if (this.verified_words[this_word_id]) {
      return [this.copy()];
    }
    // it wasn't filled, so find all the possibilities
    else {
      for (let word of get_matches(this_word)) {
        let child = this.copy();
        for (let i = 0; i < word.length; i++) {
          child.grid[this.word_map[this_word_id][i]] = word[i];
        }
        child.verified_words[this_word_id] = true;
        // check the intersecting words that aren't already verified
        let flag = true;
        let dr = 1 + this.N - (this.word_map[this_word_id][1] - this.word_map[this_word_id][0]);
        for (let i = 0; i < this.word_map[this_word_id].length; i++) {
          let intersecting_word = child.get_word(child.word_map[this_word_id][i], dr);
          if (!child.verified_words[i] && !has_matches(intersecting_word)) {
            flag = false;
            break;
          }
        }
        if (flag) {
          ret.push(child);
        }
      }

    }

    return ret;
  }


  is_full() {
    return !this.grid.includes(0);
  }

  get_possible_fills(k) {
    if (!this.word_map) {
      this.get_word_map();
    }

    // let ret = [];

    let start_word_id = 0;
    for (let i = 0; i < this.word_map.length; i++) {
      let word = this.get_word_from_locs(this.word_map[i]);
      if (!word.includes('-')) {
        start_word_id = i;
        break;
      }
    }

    let stack = [[this.copy(), start_word_id]];
    while (stack.length > 0) {
      let state = stack.pop();
      let cw = state[0];
      let this_word_id = state[1];
      if (this_word_id == k) {
        return cw;
      } else {
        let children = cw.get_children(this_word_id);
        if (children.length > 0) {
          for (let child of children) {
            stack.push([child, this_word_id + 1]);
          }
        }
      }
    }
    // return ret;
  }

}










// TODO
// 1. rewrite this so the grid is an object
// 2. have a field that keeps track of which words have been "verified"
//    either by being in the original or by being vetted
// 3. find a better DS to hold the dictionary for `has_matches()`
// 4. get a better word list (graded)
// 5. order children by grade in word list (so more common words are first)








