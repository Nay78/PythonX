const express = require("express");
const { exec } = require("child_process");

const app = express();
const port = 3000;

app.use(express.json());

app.post("/run-script", (req, res) => {
  const { script } = req.body;

  // todo: check if printer prints

  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      res.status(500).json({ error: "Error executing script" });
      return;
    }

    console.log(`Script output: ${stdout}`);
    res.json({ output: stdout });
  });
});

app.post("/create_label", (req, res) => {
  const { script } = req.body;

  // todo: check if printer prints
  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      res.status(500).json({ error: "Error executing script" });
      return;
    }

    console.log(`Script output: ${stdout}`);
    res.json({ output: stdout });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
