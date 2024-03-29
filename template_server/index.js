const express = require("express");
const { exec } = require("child_process");
const args = process.argv.slice(2);
const path = require("path");
const os = require("os");

const app = express();
const port = args[0] || 2999;
const brother_ql_path = args[1];
const printer_ip = args[2];

function today(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fetchStatus() {
  const command = `${brother_ql_path} --backend network --model QL-810W --printer tcp://${printer_ip} status`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return;
    }

    console.log(`Script output: ${stdout}`);
    return stdout;
  });
}

// START
let printing = false;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: fetchStatus() });
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

app.get("/print_label2", (req, res) => {
  const query = req.query;
  console.log(query);
  file = query.file || "";

  const command = `python label.py print --brother ${file}`;
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

app.get("/print_label", async (req, res) => {
  if (printing) {
    res.json({ output: "Already printing" });
    return;
  }
  printing = true;
  const query = req.query;
  console.log(query);
  const qty = query.qty || 0;
  const wait = query.wait || 2;
  const filepath = query.file || path.join(os.homedir(), "Templates", "Output", `${today()}.png`);

  const command = `${brother_ql_path} --backend network --model QL-810W --printer tcp://${printer_ip} print --label 62 -d ${filepath}`;
  // const command = `python label.py print --brother ${file}`;
  console.log("command", command);

  for (let i = 0; i < qty; i++) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        res.status(500).json({ error: "Error executing script", message: error.message });
        return;
      }

      console.log(`Script output: ${stdout}`);
      // res.json({ output: stdout });
    });
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    // setTimeout(() => {}, wait * 2000);
  }

  res.json({ output: "success", wait: wait * 1000, qty: qty, filepath: filepath });
  printing = false;
  return;

  //   res.json({ output: query });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
