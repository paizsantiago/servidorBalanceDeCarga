process.on("message", (msg) => {
  let arrayRandomNum = [];
  for (let i = 0; i < msg; i++) {
    arrayRandomNum.push(Math.floor(Math.random() * 1000) + 1);
  }
  process.send({msg, arrayRandomNum});
});