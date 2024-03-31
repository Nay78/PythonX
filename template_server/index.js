const express = require("express");
const { exec } = require("child_process");
const args = process.argv.slice(2);
const path = require("path");
const os = require("os");
const WebSocket = require("ws");

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

async function fetchAndExtractPrintingStatus(url) {
  try {
    // Fetch the response
    const response = await fetch(url);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Read the response text
    const responseText = await response.text();

    // Parse the XML response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, "text/xml");

    // Find the element with class "moniOk"
    const printingStatusElement = xmlDoc.querySelector(".moniOk");

    // Extract the status text
    if (printingStatusElement) {
      return printingStatusElement.textContent.trim();
    } else {
      throw new Error("Printing status not found in the response");
    }
  } catch (error) {
    console.error("Error:", error.message, url);
  }
}

// START
let printing = false;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("Received: %s", message);
    ws.send(`Received: ${message}`);
    // ... handle message here ...
  });

  ws.send("Hello from server ");
});

// Define a route to serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/status", async (req, res) => {
  // fetchAndExtractPrintingStatus(`http://${printer_ip}/status`)
  const url = `http://${printer_ip}/general/monitor.html`;
  const status = await fetchAndExtractPrintingStatus(url);
  res.json({ status, url });
  return;
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
        res.status(500).json({ error: "Error executing script", output: error.message });
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
