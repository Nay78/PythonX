const express = require("express");
const { exec } = require("child_process");
const args = process.argv.slice(2);

const app = express();
const port = args[0] || 2999;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
  return;
});

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

app.get("/create_label", (req, res) => {
  const query = req.query;
  console.log(query);

  const offset = query.date_offset || 0;
  const file = query.file;

  if (file === undefined) {
    res.status(400).json({ error: "file parameter is required" });
    return;
  }

  const command = `python label.py create --date-offset ${offset} ${file}`;
  console.log("command", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      res.status(500).json({ error: "Error executing script", message: error.message });
      return;
    }

    console.log(`Script output: ${stdout}`);
    res.json({ output: stdout });
    return;
  });

  //   res.json({ output: query });
});

app.get("/print_label", (req, res) => {
  const query = req.query;
  console.log(query);
  file = query.file || "";

  const command = `python label.py print ${file}`;
  console.log("command", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      res.status(500).json({ error: "Error executing script", message: error.message });
      return;
    }

    console.log(`Script output: ${stdout}`);
    res.json({ output: stdout });
    return;
  });
  //   res.json({ output: query });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
