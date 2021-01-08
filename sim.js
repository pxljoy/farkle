const throwDice = (n) => {
  return new Array(n).fill(0).map(c => Math.round(Math.random()*5));
}

const processOneFives = (n, returnAll) => {
  n; // ?
  const [, ones] = n.find(v => `${v[0]}` === '0') || []; // ?
  const [, fives] = n.find(v => `${v[0]}` === '4') || []; // ?
  ones;
  fives;
  // f;

  const reroll = n.reduce((sum, [v, k]) => `${v}` !== '0' && `${v}` !== '4' ? sum + k: sum, 0); // ?

  const score = ((ones||0)*100) + ((fives||0)*50);
  if (!returnAll) return score;

  return {
    value: score,
    reroll,
    name: !score ? 'Bust' : 'Misc',
  }
}

const findDupes = (nBasic, single) => {
  let n;
  if (Array.isArray(nBasic[0])) {
    n = nBasic.filter(c => c[1]).map(c => parseInt(c[0], 10));
  } else {
    n = nBasic;
  }

  const types = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
  };
  n.forEach((n2) => {
    if (!types[n2]) {
      types[n2] = 1;
    } else {
      types[n2] += 1;
    }
  });

  let t = Object.entries(types); // ?
  let tValues = Object.values(types); // ?

  // straight
  if (tValues.length === 6 && tValues.every(v => v === 1)) {
    return { name: 'Straight', value: 1500 };
  }
  // 6 of a kind
  if (tValues.some(v => v === 6)) {
    return { name: '6 of a Kind', value: 3000 };
  }
  // 5 of a kind
  if (tValues.some(v => v === 5)) {
    return { name: '5 of a Kind', value: 2000 + processOneFives(t.filter(v => v[1] !== 5)) };
  }
  // 4 of a kind and a pair
  if (tValues.some(v => v === 4) && tValues.some(v => v === 2)) {
    return { name: '4 of a Kind + Pair', value: 1500 };
  }
  // 4 of a kind
  if (tValues.some(v => v === 4)) {
    return { name: '4 of a Kind', value: 1000 + processOneFives(t.filter(v => v[1] !== 4)) };
  }
  // 2 triples
  if (tValues.filter(v => v === 3).length === 2) {
    return { name: '2 Triplets', value: 2500 };
  }

  // 3 of a kind
  if (tValues.some(v => v === 3)) {
    const [candidate] = t.find(v => v[1] === 3);
    const k =(`${candidate}` === '0' ? 300 : (parseInt(candidate, 10) + 1) * 100);
    return { name: '3 of a Kind', value: k + processOneFives(t.filter(v => v[1] !== 3)) };
  }
  // 3 pairs
  if (tValues.filter(v => v === 2).length === 3) {
    return { name: '3 Pair', value: 1500 };
  }

  if (!single) {
    return processOneFives(t, true);
  }
  return {name: 'Bust', value: 0 };
}

const run = (dice) => {
  const result = findDupes(dice);

  return { score: result.value, name: result.name, reroll: result.reroll | 0 }
}

const parseTurn = (diceNum, existingScore = 0) => {
  if (existingScore) {
    console.log(`Continuuing ${players[playerTurn].name}'s turn (${existingScore} points so far)`);
  } else {
    console.log(`Currently ${players[playerTurn].name}'s turn`);
  }
  const dice = throwDice(diceNum);
  console.log('Rolling...\n');
  console.log(`${players[playerTurn].name}'s dice is: `, dice.map(c => c + 1).join(', '), '\n');
  const result = run(dice);

  // console.log(result);

  if (!result.score) {
    if (existingScore) {
      console.log('Ouch... bust!');
    } else {
      console.log('Ouch... no points :(');
    }
    players[playerTurn].scores.push(result);
    updatePlayer();
    checkingReroll = false;
    return {
      result,
    }
  } else {
    if (result.reroll) {
      console.log(`${players[playerTurn].name}'s hand's score is ${result.score}${existingScore ? `, Totalling ${existingScore + result.score}.` : '.'} \n`);
      result.score = result.score + existingScore;
      console.log(`You have ${result.reroll} dice left. Reroll? (y/N)`);
      checkingReroll = result;
      return {
        result,
      }
    } else {
      result.score = result.score + existingScore;
      console.log(`Your hand's final score is ${result.score}! \n`);
      players[playerTurn].score += result.score;
      players[playerTurn].scores.push(result);
      updatePlayer();
      console.log(`Press enter to roll ${players[playerTurn].name}'s dice...`);
      return {
        result,
      }
    }
  }

}

const players = [
  {
    name: '',
    score: 0,
    scores: [],
  },
  {
    name: '',
    score: 0,
    scores: [],
  }
];

let playingTo = 10000;
let playerTurn = 0;
let playing = false;
let checkingReroll = false;
let checkingRerollScore = 0;

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('Please enter Player 1\'s name:\n');

const printScores = (showAll) => {
  const gap = 20;
  const maxRows = 10;
  console.log(`${`PLAYING TO: ${playingTo}`.padEnd(gap, ' ')} | ${''.padEnd(gap, ' ')}`);

  console.log(`${`${players[0].name}: ${players[0].score}`.padEnd(gap, ' ')} | ${`${players[1].name}: ${players[1].score}`.padStart(gap, ' ')}`, '');
  const scoresTotal = Math.max(...players.map(c => c.scores.length));
  console.log('-'.repeat((gap*2) + 3));
  if (scoresTotal > maxRows && !showAll) {
    console.log(`${'...'.padEnd(gap, ' ')} | ${'...'.padStart(gap, ' ')}`);
  }
  for (let i = 0; i < (showAll ? scoresTotal : Math.min(scoresTotal, maxRows)); i ++) {
    const s1 = showAll ? players[0].scores[i] || {} : players[0].scores.slice(Math.max(players[0].scores.length - maxRows, 0))[i] || {};
    const s2 = showAll ? players[1].scores[i] || {} : players[1].scores.slice(Math.max(players[1].scores.length - maxRows, 0))[i] || {};
    console.log(`${`${(s1.score || '') + ', ' + (s1.name || 'N/A')}`.padEnd(gap, ' ')} | ${s2.name ? `${(s2.score || '') + ', ' + s2.name}`.padStart(gap, ' ') : ''}`);

    // console.log(`${`${(s1[i] || {}).name || ''}: ${((s1[i] || {}).score || '')}`.padEnd(gap, ' ')} | ${`${(s2[i] || {}).name || ''}: ${((s2[i] || {}).score || '')}`.padStart(gap, ' ')}`);
  }
  console.log('-'.repeat((gap*2) + 3));
  console.log('\n\n');
}

const updatePlayer = () => {
  const winner = players.find(c => c.score >= playingTo);
  const hands = players.reduce((arr, c) => [...arr, ...c.scores], []);
  const bestHandScore = Math.max(...hands.map(c => c.score));
  const bestHand = hands.find(c => c.score === bestHandScore).name;
  if (winner) {
    playing = false;
    // console.clear();
    console.log('!! !! WE HAVE A WINNER !! !!');
    printScores(true);
    console.log(`\nCongratulations to our victor, ${winner.name}!`);
    console.log('-'.repeat(43));
    console.log(`Best hand: ${bestHand}`);
    done();
  }
  playerTurn = (2/(playerTurn+1)) - 1;
}

let step = 0;
process.stdin.on('data', function (text) {

  if (step === 0) {
    console.clear();
    const name = text.trim();
    players[0].name = name;
    console.log(`Hi ${name}, please enter Player 2's name:\n`);
    step ++;
  } else if (step === 1) {
    console.clear();
    const name = text.trim();
    players[1].name = name;
    console.log(`Hi ${name}! We're ready to begin the Farkle battle between ${players[0].name} and ${name}!\n`);
    console.log(`Next, enter the winning score, e.g 10,000 (press enter for 10,000):`)
    step ++;
  } else if (step === 2) {
    console.clear();
    const nRaw = text.trim();
    const n = parseInt(nRaw);
    if (nRaw && n > 0 && !Number.isNaN(n)) {
      playingTo = n;
    } else if (nRaw) {
      console.log('Try again, I didn\'t understand that:');
      return;
    }
    console.log(`Great! Score set to ${playingTo}!\nFirst up, ${players[0].name}'s turn. Press enter to roll...`)
    step ++;
    playing = true;
  } else {
      if (playing) {
        console.clear();
        printScores();
      }

      if (checkingReroll) {
        const parsed = text.trim().toLowerCase();
        if (parsed === 'y') {
          console.clear();
          console.clear();
          printScores();
          parseTurn(checkingReroll.reroll, checkingReroll.score);
        } else if (parsed === 'n' || !parsed) {
          console.log('Gotcha. Keeping the old score!');

          players[playerTurn].score += checkingReroll.score;
          players[playerTurn].scores.push(checkingReroll);

          updatePlayer();
          // console.log(`Okay, press enter to roll ${players[playerTurn].name}\'s dice...\n`)
          checkingReroll = false;
          // return;
        } else {
          console.log('Not sure what you mean, please enter Y or N:\n');
        }
      }

      if (!checkingReroll) {
        parseTurn(6, 0);
      }

  }

});

function done() {
  process.exit();
}
